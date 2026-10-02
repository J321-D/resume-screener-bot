"""Fail-closed PayPal evidence contract for the frozen $9 premium experiment.

This module contains no credentials, network calls, webhook route, payment action,
or income mutation. It validates provider payloads *after* PayPal authentication
and webhook-signature verification have been performed by a future approved
integration.

A redirect, click, pageview, pending payment, test fixture, or unrelated $9
capture never qualifies as revenue evidence.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse
import re


PREMIUM_PRODUCT_ID = "RKS-PREMIUM-TAILORED-REPORT-V1"
PREMIUM_PRODUCT_NAME = "Premium Tailored Resume Review"
PREMIUM_PRICE_USD = Decimal("9.00")
PREMIUM_CURRENCY = "USD"
PREMIUM_ANALYSIS_CODE_LABEL = "Analysis code"
PAYPAL_CAPTURE_EVENT = "PAYMENT.CAPTURE.COMPLETED"
PAYPAL_LINK_ID_RE = re.compile(r"^PLB-[A-Z0-9]+$")
PAYPAL_CAPTURE_ID_RE = re.compile(r"^[A-Z0-9]{8,64}$")
PAYPAL_ORDER_ID_RE = re.compile(r"^[A-Z0-9]{8,64}$")


@dataclass(frozen=True)
class EvidenceDecision:
    status: str
    reason: str
    transaction_id: str | None = None
    order_id: str | None = None
    amount_usd: str | None = None
    product_id: str | None = None

    def as_dict(self) -> dict:
        return {
            "status": self.status,
            "reason": self.reason,
            "transaction_id": self.transaction_id,
            "order_id": self.order_id,
            "amount_usd": self.amount_usd,
            "product_id": self.product_id,
            "verified_income_credit_usd": (
                float(PREMIUM_PRICE_USD) if self.status == "QUALIFIED" else 0.0
            ),
        }


def _money(value: object) -> Decimal | None:
    try:
        parsed=Decimal(str(value))
    except (InvalidOperation,TypeError,ValueError):
        return None
    return parsed.quantize(Decimal("0.01"))


def _paypal_payment_link_id(url: object) -> str | None:
    value=str(url or "").strip()
    if not value:
        return None
    parsed=urlparse(value)
    if parsed.scheme!="https" or parsed.hostname not in {"www.paypal.com","paypal.com"}:
        return None
    parts=[part for part in parsed.path.split("/") if part]
    if len(parts)!=3 or parts[:2]!=["ncp","payment"]:
        return None
    link_id=parts[2].upper()
    if not PAYPAL_LINK_ID_RE.fullmatch(link_id):
        return None
    if parsed.query or parsed.fragment:
        return None
    return link_id


def validate_payment_link_resource(resource: dict) -> dict:
    """Validate the exact hosted checkout configuration before public activation."""
    if not isinstance(resource,dict):
        return {"status":"INVALID","reason":"RESOURCE_NOT_OBJECT"}
    link_id=str(resource.get("id") or "").upper()
    if not PAYPAL_LINK_ID_RE.fullmatch(link_id):
        return {"status":"INVALID","reason":"INVALID_PAYMENT_RESOURCE_ID"}
    if str(resource.get("status") or "")!="ACTIVE":
        return {"status":"INVALID","reason":"PAYMENT_RESOURCE_NOT_ACTIVE"}
    if str(resource.get("integration_mode") or "")!="LINK":
        return {"status":"INVALID","reason":"NOT_HOSTED_LINK"}
    if str(resource.get("type") or "")!="BUY_NOW":
        return {"status":"INVALID","reason":"NOT_BUY_NOW"}
    payment_link_id=_paypal_payment_link_id(resource.get("payment_link"))
    if payment_link_id!=link_id:
        return {"status":"INVALID","reason":"PAYMENT_LINK_ID_MISMATCH"}

    items=resource.get("line_items")
    if not isinstance(items,list) or len(items)!=1 or not isinstance(items[0],dict):
        return {"status":"INVALID","reason":"EXACTLY_ONE_LINE_ITEM_REQUIRED"}
    item=items[0]
    if str(item.get("product_id") or "")!=PREMIUM_PRODUCT_ID:
        return {"status":"INVALID","reason":"PRODUCT_ID_MISMATCH"}
    if str(item.get("name") or "")!=PREMIUM_PRODUCT_NAME:
        return {"status":"INVALID","reason":"PRODUCT_NAME_MISMATCH"}
    amount=item.get("unit_amount") if isinstance(item.get("unit_amount"),dict) else {}
    if str(amount.get("currency_code") or "")!=PREMIUM_CURRENCY:
        return {"status":"INVALID","reason":"CURRENCY_MISMATCH"}
    if _money(amount.get("value"))!=PREMIUM_PRICE_USD:
        return {"status":"INVALID","reason":"PRICE_MISMATCH"}
    notes=item.get("customer_notes")
    if not isinstance(notes,list) or len(notes)!=1 or not isinstance(notes[0],dict):
        return {"status":"INVALID","reason":"REQUIRED_ANALYSIS_CODE_FIELD_MISSING"}
    note=notes[0]
    if note.get("required") is not True or str(note.get("label") or "")!=PREMIUM_ANALYSIS_CODE_LABEL:
        return {"status":"INVALID","reason":"ANALYSIS_CODE_FIELD_MISMATCH"}

    return {
        "status":"READY",
        "reason":"EXACT_FROZEN_CHECKOUT_MATCH",
        "payment_resource_id":link_id,
        "payment_link":resource.get("payment_link"),
        "product_id":PREMIUM_PRODUCT_ID,
        "product_name":PREMIUM_PRODUCT_NAME,
        "price_usd":str(PREMIUM_PRICE_USD),
        "currency":PREMIUM_CURRENCY,
        "customer_binding":{
            "field":PREMIUM_ANALYSIS_CODE_LABEL,
            "required":True,
            "provider_mapping_proven":False,
        },
        "payment_action_authorized":False,
        "public_activation_authorized":False,
    }


def _capture_order_id(resource: dict) -> str | None:
    supplementary=(
        resource.get("supplementary_data")
        if isinstance(resource.get("supplementary_data"),dict)
        else {}
    )
    related=(
        supplementary.get("related_ids")
        if isinstance(supplementary.get("related_ids"),dict)
        else {}
    )
    order_id=str(related.get("order_id") or "").upper()
    return order_id if PAYPAL_ORDER_ID_RE.fullmatch(order_id) else None


def _order_product_ids(order: dict) -> set[str]:
    """Collect only explicit provider-returned item identities; never infer by text."""
    out=set()
    units=order.get("purchase_units") if isinstance(order.get("purchase_units"),list) else []
    for unit in units:
        if not isinstance(unit,dict):
            continue
        items=unit.get("items") if isinstance(unit.get("items"),list) else []
        for item in items:
            if not isinstance(item,dict):
                continue
            for key in ("product_id","sku"):
                value=str(item.get(key) or "").strip()
                if value:
                    out.add(value)
    return out


def validate_completed_payment(
    webhook_event: dict,
    order_details: dict,
    *,
    webhook_signature_verified: bool,
    live_environment: bool,
) -> EvidenceDecision:
    """Qualify one live provider-verified $9 capture or fail closed.

    The future network adapter must verify the raw PayPal webhook signature
    before calling this function. Order details must be fetched independently
    from PayPal using the related order ID, not trusted from browser redirect
    parameters.
    """
    if not live_environment:
        return EvidenceDecision("REJECTED","NON_LIVE_ENVIRONMENT")
    if not webhook_signature_verified:
        return EvidenceDecision("REJECTED","WEBHOOK_SIGNATURE_NOT_VERIFIED")
    if not isinstance(webhook_event,dict) or webhook_event.get("event_type")!=PAYPAL_CAPTURE_EVENT:
        return EvidenceDecision("REJECTED","NOT_COMPLETED_CAPTURE_EVENT")
    resource=webhook_event.get("resource") if isinstance(webhook_event.get("resource"),dict) else {}
    if str(resource.get("status") or "")!="COMPLETED":
        return EvidenceDecision("REJECTED","CAPTURE_NOT_COMPLETED")

    capture_id=str(resource.get("id") or "").upper()
    if not PAYPAL_CAPTURE_ID_RE.fullmatch(capture_id):
        return EvidenceDecision("REJECTED","INVALID_CAPTURE_ID")
    amount=resource.get("amount") if isinstance(resource.get("amount"),dict) else {}
    if str(amount.get("currency_code") or "")!=PREMIUM_CURRENCY:
        return EvidenceDecision("REJECTED","CAPTURE_CURRENCY_MISMATCH",capture_id)
    captured=_money(amount.get("value"))
    if captured!=PREMIUM_PRICE_USD:
        return EvidenceDecision(
            "REJECTED","CAPTURE_AMOUNT_MISMATCH",capture_id,
            amount_usd=str(captured) if captured is not None else None,
        )

    order_id=_capture_order_id(resource)
    if not order_id:
        return EvidenceDecision("REJECTED","RELATED_ORDER_ID_MISSING",capture_id)
    if not isinstance(order_details,dict):
        return EvidenceDecision("REJECTED","ORDER_DETAILS_MISSING",capture_id,order_id)
    if str(order_details.get("id") or "").upper()!=order_id:
        return EvidenceDecision("REJECTED","ORDER_ID_MISMATCH",capture_id,order_id)
    if str(order_details.get("status") or "")!="COMPLETED":
        return EvidenceDecision("REJECTED","ORDER_NOT_COMPLETED",capture_id,order_id)

    product_ids=_order_product_ids(order_details)
    if PREMIUM_PRODUCT_ID not in product_ids:
        # PayPal Payment Links document product_id on the link resource, but the
        # exact propagation into the resulting order must be proven against a
        # sandbox capture before production attribution is enabled.
        return EvidenceDecision(
            "NEEDS_PROVIDER_MAPPING_PROOF",
            "FROZEN_PRODUCT_ID_NOT_PRESENT_IN_ORDER_DETAILS",
            capture_id,order_id,str(captured),
        )

    return EvidenceDecision(
        "QUALIFIED",
        "LIVE_SIGNED_COMPLETED_CAPTURE_MATCHES_FROZEN_PRODUCT_AND_PRICE",
        capture_id,order_id,str(captured),PREMIUM_PRODUCT_ID,
    )

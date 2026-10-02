"""Tests for the frozen PayPal $9 revenue evidence contract."""

from api.services.paypal_payment_evidence import (
    PREMIUM_PRODUCT_ID,
    PREMIUM_PRODUCT_NAME,
    validate_completed_payment,
    validate_payment_link_resource,
)


def _link_resource(**updates):
    row={
        "id":"PLB-ABC123XYZ",
        "status":"ACTIVE",
        "integration_mode":"LINK",
        "type":"BUY_NOW",
        "payment_link":"https://www.paypal.com/ncp/payment/PLB-ABC123XYZ",
        "line_items":[{
            "name":PREMIUM_PRODUCT_NAME,
            "product_id":PREMIUM_PRODUCT_ID,
            "unit_amount":{"currency_code":"USD","value":"9.00"},
        }],
    }
    row.update(updates)
    return row


def _capture(**updates):
    resource={
        "id":"9AB12345CD678901E",
        "status":"COMPLETED",
        "amount":{"currency_code":"USD","value":"9.00"},
        "supplementary_data":{"related_ids":{"order_id":"5AB12345CD678901E"}},
    }
    resource.update(updates)
    return {
        "event_type":"PAYMENT.CAPTURE.COMPLETED",
        "resource":resource,
    }


def _order(*, include_product=True, **updates):
    item={
        "name":PREMIUM_PRODUCT_NAME,
        "unit_amount":{"currency_code":"USD","value":"9.00"},
    }
    if include_product:
        item["sku"]=PREMIUM_PRODUCT_ID
    row={
        "id":"5AB12345CD678901E",
        "status":"COMPLETED",
        "purchase_units":[{"items":[item]}],
    }
    row.update(updates)
    return row


def test_exact_payment_link_resource_is_ready_but_not_authorized():
    out=validate_payment_link_resource(_link_resource())

    assert out["status"]=="READY"
    assert out["payment_resource_id"]=="PLB-ABC123XYZ"
    assert out["product_id"]==PREMIUM_PRODUCT_ID
    assert out["price_usd"]=="9.00"
    assert out["payment_action_authorized"] is False
    assert out["public_activation_authorized"] is False


def test_payment_link_resource_rejects_wrong_host_query_price_or_product():
    cases=[
        _link_resource(payment_link="https://evil.example/ncp/payment/PLB-ABC123XYZ"),
        _link_resource(payment_link="https://www.paypal.com/ncp/payment/PLB-ABC123XYZ?x=1"),
        _link_resource(line_items=[{
            "name":PREMIUM_PRODUCT_NAME,
            "product_id":PREMIUM_PRODUCT_ID,
            "unit_amount":{"currency_code":"USD","value":"9.01"},
        }]),
        _link_resource(line_items=[{
            "name":PREMIUM_PRODUCT_NAME,
            "product_id":"OTHER",
            "unit_amount":{"currency_code":"USD","value":"9.00"},
        }]),
    ]
    reasons={
        validate_payment_link_resource(row)["reason"]
        for row in cases
    }

    assert "PAYMENT_LINK_ID_MISMATCH" in reasons
    assert "PRICE_MISMATCH" in reasons
    assert "PRODUCT_ID_MISMATCH" in reasons


def test_completed_payment_qualifies_only_signed_live_exact_product_and_price():
    out=validate_completed_payment(
        _capture(),
        _order(),
        webhook_signature_verified=True,
        live_environment=True,
    ).as_dict()

    assert out["status"]=="QUALIFIED"
    assert out["transaction_id"]=="9AB12345CD678901E"
    assert out["order_id"]=="5AB12345CD678901E"
    assert out["amount_usd"]=="9.00"
    assert out["product_id"]==PREMIUM_PRODUCT_ID
    assert out["verified_income_credit_usd"]==9.0


def test_click_redirect_unsigned_test_and_wrong_amount_never_count():
    unsigned=validate_completed_payment(
        _capture(),_order(),
        webhook_signature_verified=False,live_environment=True,
    ).as_dict()
    sandbox=validate_completed_payment(
        _capture(),_order(),
        webhook_signature_verified=True,live_environment=False,
    ).as_dict()
    wrong=validate_completed_payment(
        _capture(amount={"currency_code":"USD","value":"8.99"}),
        _order(),
        webhook_signature_verified=True,live_environment=True,
    ).as_dict()
    redirect=validate_completed_payment(
        {"event_type":"RETURN_URL","resource":{}},
        _order(),
        webhook_signature_verified=True,live_environment=True,
    ).as_dict()

    for row in (unsigned,sandbox,wrong,redirect):
        assert row["status"]=="REJECTED"
        assert row["verified_income_credit_usd"]==0.0


def test_missing_provider_product_mapping_stays_need_proof_not_revenue():
    out=validate_completed_payment(
        _capture(),
        _order(include_product=False),
        webhook_signature_verified=True,
        live_environment=True,
    ).as_dict()

    assert out["status"]=="NEEDS_PROVIDER_MAPPING_PROOF"
    assert out["reason"]=="FROZEN_PRODUCT_ID_NOT_PRESENT_IN_ORDER_DETAILS"
    assert out["transaction_id"]=="9AB12345CD678901E"
    assert out["verified_income_credit_usd"]==0.0


def test_order_and_capture_identity_must_match():
    order=_order(id="DIFFERENTORDER99")
    out=validate_completed_payment(
        _capture(),order,
        webhook_signature_verified=True,live_environment=True,
    ).as_dict()

    assert out["status"]=="REJECTED"
    assert out["reason"]=="ORDER_ID_MISMATCH"
    assert out["verified_income_credit_usd"]==0.0


def test_contract_has_no_credentials_network_routes_or_income_side_effects():
    import inspect
    import api.services.paypal_payment_evidence as evidence

    source=inspect.getsource(evidence)
    forbidden=(
        "urllib.request",
        "requests.",
        "httpx.",
        "APIRouter",
        "CLIENT_SECRET",
        "ACCESS_TOKEN",
        "sqlite3",
        "RevenueRegistry",
    )
    assert all(token not in source for token in forbidden)

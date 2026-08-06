"""Centralized responsive styling for the recruiter-facing interface."""

from __future__ import annotations

import streamlit as st


APP_CSS = """
:root {
    --rks-surface: transparent;
    --rks-surface-muted: transparent;
    --rks-border: currentColor;
    --rks-text-primary: currentColor;
    --rks-text-secondary: currentColor;
    --rks-accent: currentColor;
    --rks-accent-soft: transparent;
    --rks-matched: #147d64;
    --rks-missing: #b54747;
    --rks-warning: #a25c00;
    --rks-radius: 16px;
    --rks-shadow: 0 12px 32px color-mix(in srgb, currentColor 10%, transparent);
}

.rks-hero {
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    padding: 1.4rem 1.5rem;
    margin: 0 0 1.25rem;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    border-radius: var(--rks-radius);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, currentColor 3%, transparent),
        color-mix(in srgb, currentColor 8%, transparent)
    );
    box-shadow: var(--rks-shadow);
}

.rks-hero h1 {
    color: var(--rks-text-primary);
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.12;
    margin: 0;
    overflow-wrap: anywhere;
}

.rks-eyebrow {
    color: var(--rks-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
    opacity: 0.82;
    text-transform: uppercase;
}

.rks-hero-copy {
    color: var(--rks-text-secondary);
    font-size: 1rem;
    margin: 0.25rem 0 0.75rem;
    opacity: 0.76;
}

.rks-disclaimer {
    color: var(--rks-text-secondary);
    font-size: 0.88rem;
    margin: 0;
    opacity: 0.76;
}

.rks-panel-label {
    color: var(--rks-text-primary);
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
}

.rks-panel-copy {
    color: var(--rks-text-secondary);
    font-size: 0.88rem;
    margin-bottom: 0.8rem;
    opacity: 0.76;
}

.rks-section-rule {
    border-top: 1px solid var(--rks-border);
    margin: 1.5rem 0 1rem;
}

.rks-footer {
    color: var(--rks-text-secondary);
    font-size: 0.82rem;
    padding: 1.5rem 0 0.5rem;
    text-align: center;
    opacity: 0.76;
}

@media (max-width: 760px) {
    .rks-hero {
        border-radius: 12px;
        padding: 0.9rem;
    }

    .rks-hero h1 {
        font-size: 1.85rem;
        line-height: 1.15;
    }

    .rks-hero-copy {
        font-size: 0.9rem;
        line-height: 1.45;
    }

    .rks-disclaimer {
        font-size: 0.82rem;
        line-height: 1.4;
    }

    [data-testid="stHorizontalBlock"] {
        align-items: stretch;
        flex-direction: column;
    }

    [data-testid="stHorizontalBlock"] > div {
        min-width: 100%;
        width: 100%;
    }

    [data-testid="stFileUploader"],
    [data-testid="stTextArea"],
    [data-testid="stDownloadButton"],
    [data-testid="stDownloadButton"] button {
        width: 100%;
    }
}
"""


def apply_app_styles() -> None:
    """Inject static semantic styles without incorporating user content."""
    st.markdown(f"<style>{APP_CSS}</style>", unsafe_allow_html=True)

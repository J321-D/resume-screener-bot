"""Centralized responsive styling for the recruiter-facing interface."""

from __future__ import annotations

import streamlit as st


APP_CSS = """
:root {
    --rks-surface: color-mix(in srgb, currentColor 2%, transparent);
    --rks-surface-raised: color-mix(in srgb, currentColor 4%, transparent);
    --rks-surface-muted: color-mix(in srgb, currentColor 6%, transparent);
    --rks-border: color-mix(in srgb, currentColor 14%, transparent);
    --rks-text-primary: currentColor;
    --rks-text-secondary: currentColor;
    --rks-accent: #315efb;
    --rks-accent-strong: #2448cf;
    --rks-accent-soft: color-mix(in srgb, #315efb 11%, transparent);
    --rks-matched: #147d64;
    --rks-missing: #b54747;
    --rks-warning: #a25c00;
    --rks-radius-sm: 8px;
    --rks-radius: 12px;
    --rks-radius-lg: 18px;
    --rks-shadow-sm: 0 1px 2px color-mix(in srgb, currentColor 8%, transparent);
    --rks-shadow: 0 18px 44px color-mix(in srgb, currentColor 8%, transparent);
    --rks-space-1: 0.25rem;
    --rks-space-2: 0.5rem;
    --rks-space-3: 0.75rem;
    --rks-space-4: 1rem;
    --rks-space-6: 1.5rem;
    --rks-space-8: 2rem;
}

.stApp {
    background-image:
        radial-gradient(circle at 15% -10%, color-mix(in srgb, #315efb 8%, transparent), transparent 28rem),
        linear-gradient(color-mix(in srgb, currentColor 1.5%, transparent), transparent 14rem);
}

[data-testid="stMainBlockContainer"] {
    max-width: 1180px;
    padding-top: 4.5rem;
    padding-bottom: 3rem;
}

.rks-nav {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--rks-space-6);
    min-height: 2.5rem;
}

.rks-brand {
    align-items: center;
    display: flex;
    font-size: 0.9rem;
    font-weight: 700;
    gap: 0.65rem;
    letter-spacing: -0.01em;
}

.rks-brand-mark {
    align-items: center;
    background: var(--rks-accent);
    border-radius: 9px;
    box-shadow: 0 6px 18px color-mix(in srgb, #315efb 28%, transparent);
    color: #fff;
    display: inline-flex;
    font-size: 0.78rem;
    height: 1.85rem;
    justify-content: center;
    width: 1.85rem;
}

.rks-nav-status {
    align-items: center;
    border: 1px solid var(--rks-border);
    border-radius: 999px;
    display: flex;
    font-size: 0.76rem;
    gap: 0.45rem;
    opacity: 0.72;
    padding: 0.35rem 0.65rem;
}

.rks-status-dot {
    background: var(--rks-matched);
    border-radius: 999px;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--rks-matched) 16%, transparent);
    height: 0.42rem;
    width: 0.42rem;
}

.rks-hero {
    align-items: center;
    box-sizing: border-box;
    display: grid;
    gap: 2rem;
    grid-template-columns: minmax(0, 1fr) minmax(190px, 0.32fr);
    max-width: 100%;
    overflow: hidden;
    padding: 2.25rem 2.5rem;
    margin: 0 0 2rem;
    border: 1px solid var(--rks-border);
    border-radius: var(--rks-radius-lg);
    background: var(--rks-surface);
    box-shadow: var(--rks-shadow);
}

.rks-hero h1 {
    color: var(--rks-text-primary);
    font-size: clamp(2rem, 4vw, 3.15rem);
    letter-spacing: -0.045em;
    line-height: 1.04;
    margin: 0;
    max-width: 760px;
    overflow-wrap: anywhere;
}

.rks-eyebrow {
    color: var(--rks-accent);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
}

.rks-hero-copy {
    color: var(--rks-text-secondary);
    font-size: 1.02rem;
    line-height: 1.6;
    margin: 0.8rem 0 1rem;
    max-width: 650px;
    opacity: 0.72;
}

.rks-disclaimer {
    color: var(--rks-text-secondary);
    align-items: center;
    display: flex;
    font-size: 0.8rem;
    gap: 0.4rem;
    margin: 0;
    opacity: 0.68;
}

.rks-hero-aside {
    border-left: 1px solid var(--rks-border);
    padding: 0.6rem 0 0.6rem 1.75rem;
}

.rks-hero-signal {
    align-items: end;
    display: flex;
    gap: 0.25rem;
    height: 2rem;
    margin-bottom: 0.8rem;
}

.rks-hero-signal span {
    background: var(--rks-accent);
    border-radius: 2px;
    display: block;
    opacity: 0.75;
    width: 0.35rem;
}

.rks-hero-signal span:nth-child(1) { height: 45%; }
.rks-hero-signal span:nth-child(2) { height: 72%; }
.rks-hero-signal span:nth-child(3) { height: 100%; }

.rks-hero-aside-label {
    font-size: 0.78rem;
    font-weight: 700;
}

.rks-hero-aside-copy {
    font-size: 0.76rem;
    line-height: 1.45;
    margin-top: 0.25rem;
    opacity: 0.6;
}

.rks-section-heading,
.rks-export-heading {
    align-items: center;
    display: flex;
    gap: 0.85rem;
    margin: 2rem 0 1rem;
}

.rks-section-heading--compact {
    margin-top: 1.5rem;
}

.rks-section-heading h2,
.rks-export-heading h2 {
    font-size: 1.08rem;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin: 0;
}

.rks-section-heading p,
.rks-export-heading p {
    font-size: 0.8rem;
    margin: 0.16rem 0 0;
    opacity: 0.6;
}

.rks-step,
.rks-section-icon,
.rks-export-icon {
    align-items: center;
    background: var(--rks-accent-soft);
    border: 1px solid color-mix(in srgb, var(--rks-accent) 20%, transparent);
    border-radius: var(--rks-radius-sm);
    color: var(--rks-accent);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.7rem;
    font-weight: 800;
    height: 2rem;
    justify-content: center;
    width: 2rem;
}

.rks-step--success {
    background: color-mix(in srgb, var(--rks-matched) 10%, transparent);
    border-color: color-mix(in srgb, var(--rks-matched) 22%, transparent);
    color: var(--rks-matched);
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
    margin-top: 0.15rem;
    opacity: 0.62;
}

.rks-panel-header {
    align-items: center;
    display: flex;
    gap: 0.8rem;
    margin-bottom: 1rem;
}

.rks-panel-icon {
    align-items: center;
    background: var(--rks-accent-soft);
    border-radius: 10px;
    color: var(--rks-accent);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1rem;
    height: 2.35rem;
    justify-content: center;
    width: 2.35rem;
}

.rks-section-rule {
    border-top: 1px solid var(--rks-border);
    margin: 2.5rem 0 0;
}

.rks-progress {
    background: var(--rks-surface-muted);
    border-radius: 999px;
    height: 0.46rem;
    margin-top: 0.9rem;
    overflow: hidden;
}

.rks-progress span {
    background: var(--rks-accent);
    border-radius: inherit;
    display: block;
    height: 100%;
    transition: width 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.rks-keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.48rem;
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
}

.rks-chip {
    border: 1px solid var(--rks-border);
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 550;
    line-height: 1.3;
    max-width: 100%;
    overflow-wrap: anywhere;
    padding: 0.38rem 0.68rem;
    transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
}

.rks-chip:hover {
    transform: translateY(-1px);
}

.rks-chip--matched {
    background: color-mix(in srgb, var(--rks-matched) 9%, transparent);
    border-color: color-mix(in srgb, var(--rks-matched) 22%, transparent);
    color: var(--rks-matched);
}

.rks-chip--missing {
    background: color-mix(in srgb, var(--rks-warning) 8%, transparent);
    border-color: color-mix(in srgb, var(--rks-warning) 20%, transparent);
    color: var(--rks-warning);
}

.rks-empty-state {
    border: 1px dashed var(--rks-border);
    border-radius: var(--rks-radius-sm);
    font-size: 0.82rem;
    margin-top: 1rem;
    opacity: 0.65;
    padding: 1.25rem;
    text-align: center;
}

.rks-export-heading {
    border: 1px solid var(--rks-border);
    border-radius: var(--rks-radius);
    margin-bottom: 0.85rem;
    padding: 1rem;
}

.rks-footer {
    align-items: center;
    border-top: 1px solid var(--rks-border);
    color: var(--rks-text-secondary);
    display: flex;
    font-size: 0.82rem;
    gap: 0.55rem;
    justify-content: center;
    margin-top: 2.5rem;
    padding: 1.5rem 0 0.5rem;
    opacity: 0.62;
}

.rks-footer-separator {
    opacity: 0.4;
}

/* Refine native Streamlit surfaces while retaining semantic controls. */
[data-testid="stVerticalBlockBorderWrapper"] {
    background: var(--rks-surface);
    border-color: var(--rks-border) !important;
    border-radius: var(--rks-radius) !important;
    box-shadow: var(--rks-shadow-sm);
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

[data-testid="stVerticalBlockBorderWrapper"]:hover {
    border-color: color-mix(in srgb, var(--rks-accent) 34%, transparent) !important;
    box-shadow: 0 10px 30px color-mix(in srgb, currentColor 7%, transparent);
}

[data-testid="stFileUploaderDropzone"] {
    background: var(--rks-surface-muted);
    border: 1px dashed color-mix(in srgb, var(--rks-accent) 34%, transparent);
    border-radius: var(--rks-radius);
    min-height: 7.5rem;
    transition: background 160ms ease, border-color 160ms ease;
}

[data-testid="stFileUploaderDropzone"]:hover {
    background: var(--rks-accent-soft);
    border-color: var(--rks-accent);
}

[data-testid="stTextArea"] textarea,
[data-testid="stTextInput"] input {
    border-color: var(--rks-border);
    border-radius: var(--rks-radius-sm);
    transition: border-color 140ms ease, box-shadow 140ms ease;
}

[data-testid="stTextArea"] textarea:focus,
[data-testid="stTextInput"] input:focus {
    border-color: var(--rks-accent);
    box-shadow: 0 0 0 3px var(--rks-accent-soft);
}

[data-testid="stMetric"] {
    background: var(--rks-surface);
    border: 1px solid var(--rks-border);
    border-radius: var(--rks-radius);
    min-height: 7.2rem;
    padding: 1rem 1.1rem;
    box-shadow: var(--rks-shadow-sm);
}

[data-testid="stMetricLabel"] {
    font-size: 0.75rem;
    letter-spacing: 0.01em;
    opacity: 0.62;
}

[data-testid="stMetricValue"] {
    letter-spacing: -0.04em;
}

[data-testid="stMetricValue"] > div {
    overflow: visible;
    overflow-wrap: anywhere;
    text-overflow: clip;
    white-space: normal;
}

[data-testid="stButton"] button,
[data-testid="stDownloadButton"] button {
    border-radius: var(--rks-radius-sm);
    font-weight: 650;
    min-height: 2.75rem;
    transition: transform 120ms ease, box-shadow 140ms ease, border-color 140ms ease;
}

[data-testid="stButton"] button:hover,
[data-testid="stDownloadButton"] button:hover {
    border-color: var(--rks-accent);
    box-shadow: 0 7px 18px color-mix(in srgb, var(--rks-accent) 18%, transparent);
    transform: translateY(-1px);
}

[data-testid="stButton"] button:active,
[data-testid="stDownloadButton"] button:active {
    transform: translateY(0) scale(0.99);
}

button:focus-visible,
textarea:focus-visible,
input:focus-visible,
[role="radio"]:focus-visible {
    outline: 3px solid var(--rks-accent-soft) !important;
    outline-offset: 2px;
}

[data-testid="stExpander"] {
    border-color: var(--rks-border);
    border-radius: var(--rks-radius-sm);
}

[data-testid="stPlotlyChart"] {
    border: 1px solid var(--rks-border);
    border-radius: var(--rks-radius);
    overflow: hidden;
    padding: 0.5rem;
}

/* Keep characterization data in the component tree without duplicating it visually. */
[data-testid="stJson"] {
    display: none;
}

@keyframes rks-reveal {
    from { opacity: 0; transform: translateY(7px); }
    to { opacity: 1; transform: translateY(0); }
}

[data-testid="stMetric"],
[data-testid="stVerticalBlockBorderWrapper"],
[data-testid="stPlotlyChart"] {
    animation: rks-reveal 260ms ease both;
}

@media (max-width: 760px) {
    [data-testid="stMainBlockContainer"] {
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 4rem;
    }

    .rks-nav {
        margin-bottom: 1rem;
    }

    .rks-nav-status {
        display: none;
    }

    .rks-hero {
        border-radius: 12px;
        display: block;
        padding: 1.35rem;
    }

    .rks-hero h1 {
        font-size: clamp(1.75rem, 9vw, 2.3rem);
        line-height: 1.08;
    }

    .rks-hero-copy {
        font-size: 0.9rem;
        line-height: 1.45;
    }

    .rks-disclaimer {
        font-size: 0.82rem;
        line-height: 1.4;
    }

    .rks-hero-aside {
        display: none;
    }

    .rks-section-heading,
    .rks-export-heading {
        margin-top: 1.5rem;
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

    [data-testid="stMetric"] {
        min-height: auto;
    }

    [data-testid="stMetricValue"] {
        font-size: clamp(1.55rem, 8vw, 2rem);
        line-height: 1.12;
    }

    .rks-footer {
        align-items: center;
        flex-direction: column;
        gap: 0.2rem;
    }

    .rks-footer-separator {
        display: none;
    }
}

@media (min-width: 761px) and (max-width: 1024px) {
    [data-testid="stMainBlockContainer"] {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .rks-hero {
        grid-template-columns: minmax(0, 1fr) 180px;
        padding: 2rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
    }
}
"""


def apply_app_styles() -> None:
    """Inject static semantic styles without incorporating user content."""
    st.markdown(f"<style>{APP_CSS}</style>", unsafe_allow_html=True)

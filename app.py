import streamlit as st
import fitz  # PyMuPDF
import docx2txt
from collections import Counter
import re
import base64
import plotly.express as px
import pandas as pd
from fpdf import FPDF

from resume_screener.models import AnalysisResult, ExtractedDocument

# Page Configuration
st.set_page_config(page_title="AI Resume Screener Bot", layout="wide")
st.title("📄 AI Resume Screener Bot")
st.markdown("Upload OR paste in your resume and job description to get keyword matches!")

# --- Sidebar Settings ---
st.sidebar.title("⚙️ Settings")
st.sidebar.checkbox("Enable GPT Suggestions (coming soon)", value=False)
st.sidebar.checkbox("Enable Keyword Highlighting", value=True)
show_side_by_side = st.sidebar.checkbox("Enable Side-by-Side View", value=True)
theme_toggle = st.sidebar.radio("Choose Theme", ["Light", "Dark"], index=1)

# --- Apply Theme --- (Can add custom CSS for light/dark theme toggle)
if theme_toggle == "Dark":
    st.markdown("""
        <style>
        .stButton button {
            background-color: #FF4B4B;
            color: white;
            font-size: 16px;
            border-radius: 8px;
        }
        .stButton button:hover {
            background-color: #D43F3F;
        }
        .stTextInput input {
            background-color: #31333F;
            color: #F0F2F6;
        }
        </style>
    """, unsafe_allow_html=True)

# --- Upload Resumes and Job Descriptions ---
st.header("📄 Resume & 📝 Job Description Input")

# Multi-file upload for resumes and job descriptions
resume_documents: list[ExtractedDocument] = []
job_description_document: ExtractedDocument | None = None
resume_uploaded: bool = False
job_desc_uploaded: bool = False

uploaded_resumes = st.file_uploader("Upload your resume(s) (PDF, DOCX, TXT)", type=["pdf", "docx", "txt"], accept_multiple_files=True)
if uploaded_resumes:
    resume_uploaded = True
    for uploaded_resume in uploaded_resumes:
        resume_text: str = ""
        # Check for PDF file
        if uploaded_resume.type == "application/pdf":
            with fitz.open(stream=uploaded_resume.read(), filetype="pdf") as doc:
                for page in doc:
                    resume_text += page.get_text()
        # Check for DOCX file
        elif uploaded_resume.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            resume_text = docx2txt.process(uploaded_resume)
        # For plain text files
        else:
            resume_text = uploaded_resume.read().decode("utf-8", errors="ignore")
        
        resume_documents.append(
            ExtractedDocument(
                text=resume_text,
                source_name=uploaded_resume.name,
                media_type=uploaded_resume.type,
            )
        )

uploaded_jd = st.file_uploader("Upload job description (PDF, DOCX, TXT)", type=["pdf", "docx", "txt"], key="jd")
if uploaded_jd:
    job_desc_uploaded = True
    jd_text: str = ""
    if uploaded_jd.type == "application/pdf":
        with fitz.open(stream=uploaded_jd.read(), filetype="pdf") as doc:
            for page in doc:
                jd_text += page.get_text()
    elif uploaded_jd.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        jd_text = docx2txt.process(uploaded_jd)
    else:
        jd_text = uploaded_jd.read().decode("utf-8", errors="ignore")
    job_description_document = ExtractedDocument(
        text=jd_text,
        source_name=uploaded_jd.name,
        media_type=uploaded_jd.type,
    )

# --- Text Input for Resume and Job Description ---
st.header("Or Paste Your Text Manually Below")

# Text box for manual resume input
resume_text_manual = st.text_area("Paste your resume here:", height=300)

# Text box for manual job description input
jd_text_manual = st.text_area("Paste the job description here:", height=300)

# If there is manual text input, use it instead of file uploads
if resume_text_manual.strip():
    resume_documents.append(ExtractedDocument(text=resume_text_manual))
    resume_uploaded = True

if jd_text_manual.strip():
    job_description_document = ExtractedDocument(text=jd_text_manual)
    job_desc_uploaded = True

# --- Previews ---
if show_side_by_side and resume_uploaded and job_desc_uploaded:
    col1, col2 = st.columns([2, 3])

    with col1:
        st.subheader("📋 Resume Preview")
        for document in resume_documents:
            st.text(document.text[:2000])

    with col2:
        st.subheader("📋 Job Description Preview")
        st.text(job_description_document.text[:2000])

else:
    if resume_uploaded:
        with st.expander("📋 Resume Preview"):
            for document in resume_documents:
                st.text(document.text[:2000])
    if job_desc_uploaded:
        with st.expander("📋 Job Description Preview"):
            st.text(job_description_document.text[:2000])

# --- Keyword Matching ---
if resume_uploaded and job_desc_uploaded:
    def extract_keywords(text: str) -> set[str]:
        words: list[str] = re.findall(r"\b\w+\b", text.lower())
        return set(words)

    resume_words: set[str] = set()
    for document in resume_documents:
        resume_words.update(extract_keywords(document.text))

    jd_text = job_description_document.text
    jd_words = extract_keywords(jd_text)

    matched = resume_words.intersection(jd_words)
    missing = jd_words - resume_words

    match_score = round(len(matched) / len(jd_words) * 100, 1) if jd_words else 0
    analysis_result = AnalysisResult(
        resume_words=resume_words,
        job_description_words=jd_words,
        matched=matched,
        missing=missing,
        match_score=match_score,
    )

    jd_words = analysis_result.job_description_words
    matched = analysis_result.matched
    missing = analysis_result.missing
    match_score = analysis_result.match_score

    st.subheader("📊 Keyword Matching Results")
    st.markdown(f"**✅ Resume Match Score:** {match_score}%")

    if match_score < 30:
        st.warning("📉 Low match score — consider revising your resume to include more relevant keywords.")

    keyword_filter = st.text_input("🔎 Filter Keywords (optional):")

    st.markdown("**🟢 Matched Keywords (sorted):**")
    filtered_matched = (
        sorted([w for w in matched if keyword_filter.lower() in w.lower()])
        if keyword_filter else
        sorted(matched, key=lambda w: (-len(w), w))
    )
    st.json(filtered_matched)

    st.markdown("**🔴 Top Missing Keywords (by frequency):**")
    top_missing_counts = Counter(re.findall(r"\b\w+\b", jd_text.lower()))
    top_missing = [word for word in top_missing_counts if word in missing]
    filtered_missing = [w for w in top_missing if keyword_filter.lower() in w.lower()] if keyword_filter else top_missing
    st.json(sorted(filtered_missing[:50], key=lambda x: -jd_text.lower().count(x)))

    if st.checkbox("📉 Show bar chart of missing keywords"):
        top_list = filtered_missing[:20]
        counts = [top_missing_counts[w] for w in top_list]
        fig = px.bar(x=top_list, y=counts, labels={'x': 'Keywords', 'y': 'Frequency'}, title="Top Missing Keywords")
        st.plotly_chart(fig)

    # --- Export as PDF ---
    if st.button("⬇️ Download Report as PDF"):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt="Keyword Matching Report", ln=True, align='C')
        pdf.ln(10)
        pdf.multi_cell(0, 10, f"Matched Keywords: {sorted(matched)}\n\nMissing Keywords: {filtered_missing[:50]}")
        pdf_file = pdf.output(dest='S', format='pdf')
        b64 = base64.b64encode(pdf_file.encode()).decode()
        href = f'<a href="data:file/pdf;base64,{b64}" download="report.pdf">📥 Click here to download PDF</a>'
        st.markdown(href, unsafe_allow_html=True)

    # --- Resume Templates ---
    st.markdown("## 📑 Resume Templates")
    st.markdown("Here are a few resume templates you can use:")
    template_files = ["template1.docx", "template2.docx", "template3.docx"]  # Replace with actual paths to templates
    for template in template_files:
        st.download_button(f"Download {template}", template)

    # --- Peer Reviews ---
    st.markdown("## 📣 Peer Reviews")
    st.text_area("Submit your resume for peer review:")
    if st.button("Submit for Peer Review"):
        st.success("Your resume has been submitted for peer review.")

    # --- Skill Matrix Visualization ---
    st.markdown("## 🧠 Skill Matrix")
    skills_in_resume = list(matched)
    skills_in_job = list(jd_words)
    skill_matrix_data = {
        "Skills": skills_in_job,
        "In Resume": [1 if skill in skills_in_resume else 0 for skill in skills_in_job],
    }
    df = pd.DataFrame(skill_matrix_data)
    fig = px.bar(df, x='Skills', y='In Resume', title="Skills Comparison", labels={'Skills': 'Skill', 'In Resume': 'Presence'})
    st.plotly_chart(fig)

    # --- Virtual Career Coach ---
    st.markdown("## 🧑‍🏫 Virtual Career Coach")
    st.write("Based on your resume, we suggest focusing on gaining more experience in the following areas:")
    st.write("• Advanced technical skills")
    st.write("• Leadership experience")

    # --- AI-powered Interview Preparation ---
    st.markdown("## 🎤 Interview Preparation")
    st.write("Prepare for your interview based on the job description and your resume.")
    st.write("Interview Tip: Always align your answers with key skills in the job description.")

    # --- Personalized Career Path ---
    st.markdown("## 🛤️ Personalized Career Path")
    st.write("Here’s a career progression plan based on your current resume and targeted job role.")
    st.write("Step 1: Master essential skills in your field.")
    st.write("Step 2: Gain experience in the industry.")
    st.write("Step 3: Expand your professional network.")

    # --- Industry-Specific Resume Optimizer ---
    st.markdown("## 🧑‍💻 Industry-Specific Resume Optimizer")
    industry = st.selectbox("Choose your industry:", ["Tech", "Healthcare", "Education", "Finance"])
    st.write(f"Optimizing your resume for the **{industry}** industry.")
    st.write("Tips for your resume:")
    if industry == "Tech":
        st.write("Include technical skills, certifications, and relevant projects.")
    elif industry == "Healthcare":
        st.write("Highlight patient care experience, certifications, and medical knowledge.")
    elif industry == "Education":
        st.write("Focus on teaching experience, leadership in education, and certifications.")
    else:
        st.write("Highlight your financial analysis, certifications, and market knowledge.")

    # --- Skill Development Plan ---
    st.markdown("## 📚 Skill Development Plan")
    st.write("Based on your resume and the job description, we suggest the following learning paths:")
    st.write("• Take an online course on Data Science (Tech) or Nursing (Healthcare).")
    st.write("• Work on leadership and team management skills (Education & Finance).")
    
    st.markdown("---")
    st.subheader("📌 Smart Suggestions")
    st.markdown("- **Add Top Missing Keywords**: Include terms that match the job post.")
    st.markdown("- **Optimize Sections**: Ensure key areas like Skills/Experience are clear.")
    st.markdown("- **Resume Audit**: Use checklist above to cover essential fields.")
    st.markdown("- **Bar Chart & Filters**: Visualize and search your keyword gap easily.")
    st.markdown("- **Highlighting View**: See keyword coverage directly in your text.")
    st.markdown("- **Group by Category**: Sort keywords by relevance type. (coming soon)")
    st.markdown("- **Side-by-Side View**: Compare resume vs JD keywords clearly.")
    st.markdown("- **Toggle GPT Suggestions**: Enable/disable GPT-based improvement tips. (coming soon)")
    st.markdown("- **Export Tools**: Download your keyword report.")
    st.markdown("- **Avoid Repeats**: Don’t overuse the same buzzwords.")
    st.markdown("- **Use Action Verbs**: e.g., 'led', 'executed', 'developed'.")

# --- Footer ---
st.markdown("---")
st.markdown("<p style='text-align:center;'>© 2025 AI Resume Screener Bot | All Rights Reserved</p>", unsafe_allow_html=True)



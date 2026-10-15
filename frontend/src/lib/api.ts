import { TailorResponse, SampleDataResponse, CoverLetterResponse, TailoredResume } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchSampleData(): Promise<SampleDataResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/sample-data`);
    if (!res.ok) throw new Error("Failed to fetch sample data");
    return await res.json();
  } catch (err) {
    console.warn("Using offline sample fallback:", err);
    return {
      sample_resume_filename: "electronics_engineer (1).pdf",
      sample_resume_size_kb: 47.6,
      sample_resume_text: `CAREER OBJECTIVE
To obtain a challenging position as an Electronics Engineer where I can apply my knowledge of embedded systems, circuit design, and programming. I aim to contribute to innovative projects, continually enhance my technical skills, and support organizational growth through efficient problem-solving and hands-on engineering work.

EDUCATION & QUALIFICATIONS
2015 - 2018 Intermediate (Mathematics)
BRIGH IN NIKETAN I C OBRA SONEBHADRA

2018 - 2021 Three-Year Diploma Engineering (Electronics)
LUCKNOW POLYTECHNIC LUCKNOW, LUCKNOW

2013 - 2015 High School (Science)
BRIGH IN NIKETAN I C OBRA SONEBHADRA

CONTACT INFORMATION
Email: rahulsumesh797@gmail.com
Mob No: 8400300797
Address: Agrawal Nagar, Obra Sonebhadra (UP)
Languages: English, Hindi

PROFESSIONAL EXPERIENCE
Dec 2018 - Aug 2020: Energies IT Services Pvt. Noida
Customer Support Executive (Paytm Process)
• Handled Paytm recharge-related queries via email support, resolving transaction issues and ensuring smooth payment processing while maintaining service quality.

Oct 2020 - Nov 2021: Tech Mahindra Pvt. Limited Noida
Customer Support Executive (Flipkart Process)
• Provided technical and non-technical support for Flipkart customers via calls and emails, resolving order, payment, and product-related issues while ensuring high customer satisfaction.

TECHNICAL PROJECTS
Vehicle Detection & Counting Software (Python, OpenCV, PySerial)
• Developed a full-stack remote-based vehicle detection system with real-time counting, GUI interface, and database storage. Integrated OV7670 camera feeder and used YOLO for object detection.

Metal Detector Robot Vehicle [College Project]
• Developed a mobile vehicle equipped with a metal detector module and controlled via Bluetooth using an Android smartphone app for remote navigation and detection.

TECHNICAL SKILLS & CERTIFICATIONS
• Embedded Systems & Microcontrollers (AVR)
• Embedded C / C++ Programming
• Sensor Integration, Bluetooth (HC-05)
• Software Development & Computer Vision (OpenCV, YOLO)
• Python Programming & Database Management (DBMS)
• Microsoft Excel & PowerPoint
• Hardware & Networking
• Google Play Store Listing Certificate of Excellence in Flutter Development`,
      sample_job_description: `Strategic alliances with Harley-Davidson and Zero Motorcycles support the design and development of premium and electric motorcycles, respectively. Further demonstrating its commitment to the EV future, the Company has made strategic investments in two- and three-wheeler EV manufacturers, Ather Energy and Euler Motors. Hero MotoCorp is the only Indian two-wheeler manufacturer listed on the prestigious Dow Jones Sustainability Index (DJSI).

Hero MotoCorp's Executive Chairman, Dr. Pawan Munjal, was named to the 2023 TIME100 Climate List of the 100 most influential leaders driving business climate action.

Beyond mobility, Hero MotoCorp is a major global promoter of sports, including golf, football, field hockey, and cricket. Hero MotoSports Team Rally is India's flag bearer in global rally racing.

Requirements & Responsibilities:
• Lead technical design and development of electric vehicle systems, telemetry, and mobility electronics.
• Collaborate on microcontroller firmware, sensor integration (Bluetooth, wireless modules), and diagnostic instrumentation.
• Apply robust problem-solving, circuit design, and embedded software practices to ensure vehicle safety and efficiency.
• Demonstrate proficiency in Python, C++, communication protocols, and hardware diagnostics.
• Strong analytical, documentation, and cross-functional communication abilities.`
    };
  }
}

export async function customizeResume(
  file: File | null,
  resumeText: string | null,
  jobDescription: string
): Promise<TailorResponse> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  if (resumeText) {
    formData.append("resume_text", resumeText);
  }
  formData.append("job_description", jobDescription);

  const res = await fetch(`${API_BASE_URL}/customize`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = "Failed to customize resume";
    try {
      const errorData = await res.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  candidateName = "Candidate",
  targetRole = "Electronics / Systems Engineer",
  companyName?: string
): Promise<CoverLetterResponse> {
  const res = await fetch(`${API_BASE_URL}/cover-letter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
      candidate_name: candidateName,
      target_role: targetRole,
      company_name: companyName,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate cover letter");
  }

  return await res.json();
}

export async function downloadResumeFile(
  resume: TailoredResume,
  format: "pdf" | "docx" | "txt"
): Promise<void> {
  const rawName = (resume.candidate_name || "Tailored").trim();
  const safeName = rawName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_") || "Tailored";
  const filename = `${safeName}_Resume.${format}`;

  try {
    // 1. Prepare download session on backend.
    // This returns a real HTTP URL whose path explicitly ends with the file name and extension:
    // e.g., /api/download/file/Rahul_Kumar_Resume.pdf?token=...
    const prepRes = await fetch("/api/download/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, format }),
    });

    if (!prepRes.ok) {
      let errText = `Failed to prepare ${format.toUpperCase()} download (${prepRes.status})`;
      try {
        const text = await prepRes.text();
        if (text) errText = text;
      } catch {}
      throw new Error(errText);
    }

    const { download_url } = await prepRes.json();

    // 2. Trigger native browser download directly via the real HTTP URL.
    // Because the URL path ends with /Rahul_Kumar_Resume.pdf, Google Chrome and all Chrome download
    // extensions (such as folder organizers that route into ~pdf) identify the true filename and extension
    // from both the URL path and the HTTP Content-Disposition attachment header.
    // This completely eliminates blob URLs and Chrome's blob UUID naming bug.
    const link = document.createElement("a");
    link.href = download_url;
    link.download = filename;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
      } catch {}
    }, 4000);
  } catch (err) {
    console.error("Direct download link failed, falling back to form submit:", err);
    // Fallback: Native HTML Form POST
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download";
    form.style.display = "none";

    const jsonInput = document.createElement("input");
    jsonInput.type = "hidden";
    jsonInput.name = "resume_json";
    jsonInput.value = JSON.stringify(resume);
    form.appendChild(jsonInput);

    const formatInput = document.createElement("input");
    formatInput.type = "hidden";
    formatInput.name = "format";
    formatInput.value = format;
    form.appendChild(formatInput);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try {
        if (form.parentNode) form.parentNode.removeChild(form);
      } catch {}
    }, 5000);
  }
}




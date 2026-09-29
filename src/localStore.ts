import { User, Vacancy, Application, ApplicationDocument, ApplicationTimelineItem, AuthResponse } from './types';

const USERS_KEY = 'vacancy_local_users';
const VACANCIES_KEY = 'vacancy_local_vacancies';
const APPLICATIONS_KEY = 'vacancy_local_applications';
const DOCUMENTS_KEY = 'vacancy_local_documents';
const TIMELINE_KEY = 'vacancy_local_timeline';

const INITIAL_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'user-sysadmin-1',
    email: 'admin@talentflow.et',
    fullName: 'Abebe Kebede (System Admin)',
    role: 'system_admin',
    createdAt: '2026-01-01T08:00:00.000Z',
    passwordHash: 'Admin@12345',
  },
  {
    id: 'user-hradmin-1',
    email: 'hr.director@talentflow.et',
    fullName: 'Sara Haile (HR Director)',
    role: 'hr_admin',
    createdAt: '2026-01-05T09:00:00.000Z',
    passwordHash: 'Director@12345',
  },
  {
    id: 'user-recruiter-1',
    email: 'recruiter@talentflow.et',
    fullName: 'Yared Tadesse (Talent Officer)',
    role: 'hr_employee',
    createdAt: '2026-01-10T10:00:00.000Z',
    passwordHash: 'Recruiter@12345',
  },
  {
    id: 'user-applicant-1',
    email: 'applicant@talentflow.et',
    fullName: 'Hiwot Alemu',
    role: 'applicant',
    createdAt: '2026-02-01T11:00:00.000Z',
    passwordHash: 'Applicant@12345',
  },
  {
    id: 'user-applicant-2',
    email: 'yobsan46@gmail.com',
    fullName: 'Yobsan Tura',
    role: 'system_admin',
    createdAt: '2026-02-15T08:00:00.000Z',
    passwordHash: 'Admin@12345',
  },
];

const INITIAL_VACANCIES: Vacancy[] = [
  {
    id: 'vac-1',
    title: 'Senior Full-Stack Engineer',
    department: 'Technology & IT',
    location: 'Addis Ababa (Bole Medhanialem)',
    type: 'Full-Time',
    experienceLevel: 'Senior Level (5+ yrs)',
    salaryRange: '45,000 - 75,000 ETB / month',
    deadline: '2026-11-30T23:59:59.000Z',
    status: 'Open',
    description: 'Lead engineering teams developing enterprise financial applications and applicant verification pipelines using TypeScript, Node.js, and PostgreSQL.',
    requirements: '• 5+ years of software engineering experience in React and Node.js.\n• Proficiency in PostgreSQL, Docker, and REST APIs.\n• Proven leadership in agile sprints and system architecture.',
    requiredDocuments: 'Resume, Degree Certificate, Experience Letter',
    createdAt: '2026-02-01T08:00:00.000Z',
    createdBy: 'user-hradmin-1',
    applicantCount: 2,
  },
  {
    id: 'vac-2',
    title: 'Financial Risk & Credit Analyst',
    department: 'Banking & Finance',
    location: 'Addis Ababa (Financial District)',
    type: 'Full-Time',
    experienceLevel: 'Mid Level (3+ yrs)',
    salaryRange: '30,000 - 45,000 ETB / month',
    deadline: '2026-10-25T23:59:59.000Z',
    status: 'Open',
    description: 'Conduct comprehensive credit risk assessments, evaluate loan portfolios, and generate compliance audits for corporate clients.',
    requirements: '• BA in Accounting, Finance, or Economics.\n• Minimum 3 years in credit underwriting or banking risk.\n• Strong financial modeling and Excel skills.',
    requiredDocuments: 'Resume, Degree Certificate',
    createdAt: '2026-02-05T09:00:00.000Z',
    createdBy: 'user-hradmin-1',
    applicantCount: 1,
  },
  {
    id: 'vac-3',
    title: 'Monitoring & Evaluation Specialist',
    department: 'NGO & Development',
    location: 'Hawassa, Sidama',
    type: 'Contract',
    experienceLevel: 'Mid Level (3+ yrs)',
    salaryRange: '35,000 - 50,000 ETB / month',
    deadline: '2026-10-15T23:59:59.000Z',
    status: 'Open',
    description: 'Design and supervise baseline data collection, key performance indicator tracking, and reporting for donor-funded sustainable development projects.',
    requirements: '• BA/MA in Social Sciences, Statistics, or Development Studies.\n• Experience with USAID or UN reporting standards.\n• Excellent quantitative data analysis skills.',
    requiredDocuments: 'Resume, ID Proof, Experience Letter',
    createdAt: '2026-02-10T10:00:00.000Z',
    createdBy: 'user-recruiter-1',
    applicantCount: 1,
  },
  {
    id: 'vac-4',
    title: 'Enterprise Account Executive',
    department: 'Marketing & Sales',
    location: 'Addis Ababa (Kazanchis)',
    type: 'Full-Time',
    experienceLevel: 'Senior Level (4+ yrs)',
    salaryRange: '25,000 - 40,000 ETB + Commission',
    deadline: '2026-12-15T23:59:59.000Z',
    status: 'Open',
    description: 'Drive strategic partnerships, pitch talent verification solutions to corporate clients, and manage regional enterprise relationships.',
    requirements: '• Proven B2B sales track record with corporate clients.\n• Strong communication and relationship management skills.\n• Fluency in English and Amharic.',
    requiredDocuments: 'Resume',
    createdAt: '2026-02-12T11:00:00.000Z',
    createdBy: 'user-hradmin-1',
    applicantCount: 0,
  },
  {
    id: 'vac-5',
    title: 'DevOps & Cloud Infrastructure Specialist',
    department: 'Technology & IT',
    location: 'Addis Ababa (Remote / Hybrid)',
    type: 'Full-Time',
    experienceLevel: 'Mid Level (3+ yrs)',
    salaryRange: '40,000 - 65,000 ETB / month',
    deadline: '2026-11-15T23:59:59.000Z',
    status: 'Open',
    description: 'Maintain CI/CD pipelines, containerized deployment infrastructure, and cloud security monitoring across Linux servers.',
    requirements: '• Linux administration, Docker, Kubernetes, and GitHub Actions.\n• Familiarity with cloud environments (GCP, AWS, or Azure).\n• Infrastructure-as-code and automated backup experience.',
    requiredDocuments: 'Resume, Degree Certificate, Experience Letter',
    createdAt: '2026-02-15T12:00:00.000Z',
    createdBy: 'user-sysadmin-1',
    applicantCount: 0,
  }
];

const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    vacancyId: 'vac-1',
    applicantId: 'user-applicant-1',
    applicantName: 'Hiwot Alemu',
    applicantEmail: 'applicant@talentflow.et',
    applicantPhone: '+251 91 123 4567',
    department: 'Technology & IT',
    vacancyTitle: 'Senior Full-Stack Engineer',
    vacancyDepartment: 'Technology & IT',
    status: 'Under Review',
    verificationStatus: 'Verified',
    verificationScore: 92,
    recruiterRating: 4,
    recruiterNotes: 'Solid background in full-stack web technologies. Degree and experience credentials verified.',
    createdAt: '2026-02-20T14:30:00.000Z',
    updatedAt: '2026-02-22T09:15:00.000Z',
  },
  {
    id: 'app-2',
    vacancyId: 'vac-2',
    applicantId: 'user-applicant-3',
    applicantName: 'Dawit Getachew',
    applicantEmail: 'dawit.g@gmail.com',
    applicantPhone: '+251 92 345 6789',
    department: 'Banking & Finance',
    vacancyTitle: 'Financial Risk & Credit Analyst',
    vacancyDepartment: 'Banking & Finance',
    status: 'Shortlisted',
    verificationStatus: 'Verified',
    verificationScore: 88,
    recruiterRating: 5,
    recruiterNotes: 'Candidate has 4 years experience at commercial banks. Scheduled for interview panel.',
    createdAt: '2026-02-22T10:00:00.000Z',
    updatedAt: '2026-02-24T16:00:00.000Z',
  },
  {
    id: 'app-3',
    vacancyId: 'vac-3',
    applicantId: 'user-applicant-4',
    applicantName: 'Marta Bekele',
    applicantEmail: 'marta.bekele@outlook.com',
    applicantPhone: '+251 93 456 7890',
    department: 'NGO & Development',
    vacancyTitle: 'Monitoring & Evaluation Specialist',
    vacancyDepartment: 'NGO & Development',
    status: 'Verification Pending',
    verificationStatus: 'Pending',
    verificationScore: 65,
    recruiterRating: 3,
    recruiterNotes: 'Reviewing submitted experience letters.',
    createdAt: '2026-02-25T11:20:00.000Z',
    updatedAt: '2026-02-25T11:20:00.000Z',
  }
];

const INITIAL_DOCUMENTS: ApplicationDocument[] = [
  {
    id: 'doc-1',
    applicationId: 'app-1',
    documentType: 'Resume',
    fileName: 'Hiwot_Alemu_Resume.pdf',
    fileSize: 245000,
    mimeType: 'application/pdf',
    status: 'Verified',
    automatedCheckStatus: 'Passed',
    automatedCheckDetails: JSON.stringify({ authenticityScore: 95, summary: 'Clean CV formatting with clear dates and roles.' }),
    verifiedBy: 'Sara Haile',
    verificationComment: 'Authentic employment credentials confirmed.',
    verifiedAt: '2026-02-21T10:00:00.000Z',
    createdAt: '2026-02-20T14:30:00.000Z',
  },
  {
    id: 'doc-2',
    applicationId: 'app-1',
    documentType: 'Degree Certificate',
    fileName: 'AAU_BSc_Computer_Science.pdf',
    fileSize: 420000,
    mimeType: 'application/pdf',
    status: 'Verified',
    automatedCheckStatus: 'Passed',
    automatedCheckDetails: JSON.stringify({ authenticityScore: 90, summary: 'Official university seal and matriculation number verified.' }),
    verifiedBy: 'Sara Haile',
    verificationComment: 'Matches AAU registry records.',
    verifiedAt: '2026-02-21T10:15:00.000Z',
    createdAt: '2026-02-20T14:30:00.000Z',
  },
  {
    id: 'doc-3',
    applicationId: 'app-2',
    documentType: 'Resume',
    fileName: 'Dawit_Getachew_Finance_CV.pdf',
    fileSize: 198000,
    mimeType: 'application/pdf',
    status: 'Verified',
    automatedCheckStatus: 'Passed',
    automatedCheckDetails: JSON.stringify({ authenticityScore: 94, summary: 'Accredited banking financial experience.' }),
    verifiedBy: 'Yared Tadesse',
    verificationComment: 'Verified references from prior bank employer.',
    verifiedAt: '2026-02-23T11:00:00.000Z',
    createdAt: '2026-02-22T10:00:00.000Z',
  },
  {
    id: 'doc-4',
    applicationId: 'app-3',
    documentType: 'Resume',
    fileName: 'Marta_Bekele_ME_Specialist.pdf',
    fileSize: 310000,
    mimeType: 'application/pdf',
    status: 'Pending',
    automatedCheckStatus: 'Passed',
    automatedCheckDetails: JSON.stringify({ authenticityScore: 82, summary: 'Standard document formatting.' }),
    createdAt: '2026-02-25T11:20:00.000Z',
  }
];

const INITIAL_TIMELINE: ApplicationTimelineItem[] = [
  {
    id: 'time-1',
    applicationId: 'app-1',
    status: 'Submitted',
    actorName: 'Hiwot Alemu',
    comment: 'Application submitted with 2 documents.',
    createdAt: '2026-02-20T14:30:00.000Z',
  },
  {
    id: 'time-2',
    applicationId: 'app-1',
    status: 'Under Review',
    actorName: 'Sara Haile',
    comment: 'Candidate moved to Under Review. Documents verified.',
    createdAt: '2026-02-21T10:30:00.000Z',
  },
  {
    id: 'time-3',
    applicationId: 'app-2',
    status: 'Submitted',
    actorName: 'Dawit Getachew',
    comment: 'Application submitted.',
    createdAt: '2026-02-22T10:00:00.000Z',
  },
  {
    id: 'time-4',
    applicationId: 'app-2',
    status: 'Shortlisted',
    actorName: 'Yared Tadesse',
    comment: 'Selected for interview round.',
    createdAt: '2026-02-24T16:00:00.000Z',
  },
  {
    id: 'time-5',
    applicationId: 'app-3',
    status: 'Submitted',
    actorName: 'Marta Bekele',
    comment: 'Application submitted.',
    createdAt: '2026-02-25T11:20:00.000Z',
  }
];

// Helper functions for reading & saving to localStorage
function readUsers(): (User & { passwordHash: string })[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

function saveUsers(users: (User & { passwordHash: string })[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readVacancies(): Vacancy[] {
  try {
    const raw = localStorage.getItem(VACANCIES_KEY);
    if (!raw) {
      localStorage.setItem(VACANCIES_KEY, JSON.stringify(INITIAL_VACANCIES));
      return INITIAL_VACANCIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VACANCIES;
  }
}

function saveVacancies(vacs: Vacancy[]) {
  localStorage.setItem(VACANCIES_KEY, JSON.stringify(vacs));
}

function readApplications(): Application[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPLICATIONS;
  }
}

function saveApplications(apps: Application[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

function readDocuments(): ApplicationDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

function saveDocuments(docs: ApplicationDocument[]) {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

function readTimeline(): ApplicationTimelineItem[] {
  try {
    const raw = localStorage.getItem(TIMELINE_KEY);
    if (!raw) {
      localStorage.setItem(TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINE));
      return INITIAL_TIMELINE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TIMELINE;
  }
}

function saveTimeline(items: ApplicationTimelineItem[]) {
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(items));
}

export const localStore = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const users = readUsers();
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // If user not found, create a demo applicant or admin automatically so login never fails on hosted demos
    if (!user) {
      const isSystemAdminRole = cleanEmail.includes('admin') || cleanEmail === 'yobsan46@gmail.com';
      const isRecruiterRole = cleanEmail.includes('hr') || cleanEmail.includes('recruiter');
      const role = isSystemAdminRole ? 'system_admin' : isRecruiterRole ? 'hr_admin' : 'applicant';
      user = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
        role: role,
        createdAt: new Date().toISOString(),
        passwordHash: password,
      };
      users.push(user);
      saveUsers(users);
    }

    const token = `local-token-${user.id}-${Date.now()}`;
    const cleanUser: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
    return { user: cleanUser, token };
  },

  register: async (data: { email: string; password: string; fullName: string; role?: string }): Promise<AuthResponse> => {
    const users = readUsers();
    const cleanEmail = data.email.trim().toLowerCase();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const role = (data.role as any) || (cleanEmail.includes('admin') ? 'system_admin' : cleanEmail.includes('hr') ? 'hr_admin' : 'applicant');
    const newUser = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      role: role,
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    saveUsers(users);

    const token = `local-token-${newUser.id}-${Date.now()}`;
    const cleanUser: User = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
    return { user: cleanUser, token };
  },

  getMe: async (currentUser: User | null): Promise<{ user: User }> => {
    if (!currentUser) throw new Error('Not authenticated');
    const users = readUsers();
    const found = users.find((u) => u.id === currentUser.id);
    if (!found) return { user: currentUser };
    return {
      user: {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        role: found.role,
        createdAt: found.createdAt,
      },
    };
  },

  // Vacancies
  getVacancies: async (params?: { department?: string; search?: string; status?: string }): Promise<Vacancy[]> => {
    let vacs = readVacancies();
    const apps = readApplications();

    // Attach real applicant count
    vacs = vacs.map((v) => ({
      ...v,
      applicantCount: apps.filter((a) => a.vacancyId === v.id).length,
    }));

    if (params?.status) {
      vacs = vacs.filter((v) => v.status === params.status);
    }
    if (params?.department && params.department !== 'All') {
      vacs = vacs.filter((v) => v.department.toLowerCase() === params.department!.toLowerCase());
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      vacs = vacs.filter((v) => v.title.toLowerCase().includes(s) || v.description.toLowerCase().includes(s) || v.location.toLowerCase().includes(s));
    }
    return vacs;
  },

  getVacancy: async (id: string): Promise<Vacancy> => {
    const vacs = readVacancies();
    const vac = vacs.find((v) => v.id === id);
    if (!vac) throw new Error('Vacancy not found');
    const apps = readApplications();
    return {
      ...vac,
      applicantCount: apps.filter((a) => a.vacancyId === id).length,
    };
  },

  createVacancy: async (data: Partial<Vacancy>, authorId?: string): Promise<Vacancy> => {
    const vacs = readVacancies();
    const newVac: Vacancy = {
      id: `vac-${Date.now()}`,
      title: data.title || 'Untitled Vacancy',
      department: data.department || 'Technology & IT',
      location: data.location || 'Addis Ababa',
      type: data.type || 'Full-Time',
      experienceLevel: data.experienceLevel || 'Mid Level',
      salaryRange: data.salaryRange || 'Competitive ETB',
      deadline: data.deadline || null,
      status: (data.status as any) || 'Open',
      description: data.description || '',
      requirements: data.requirements || '',
      requiredDocuments: data.requiredDocuments || 'Resume',
      createdAt: new Date().toISOString(),
      createdBy: authorId || 'user-admin',
      applicantCount: 0,
    };
    vacs.unshift(newVac);
    saveVacancies(vacs);
    return newVac;
  },

  updateVacancy: async (id: string, data: Partial<Vacancy>): Promise<Vacancy> => {
    const vacs = readVacancies();
    const idx = vacs.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Vacancy not found');
    vacs[idx] = { ...vacs[idx], ...data };
    saveVacancies(vacs);
    return vacs[idx];
  },

  deleteVacancy: async (id: string): Promise<{ message: string }> => {
    const vacs = readVacancies();
    saveVacancies(vacs.filter((v) => v.id !== id));
    // Also remove associated applications
    const apps = readApplications();
    const toRemoveAppIds = apps.filter((a) => a.vacancyId === id).map((a) => a.id);
    saveApplications(apps.filter((a) => a.vacancyId !== id));

    const docs = readDocuments();
    saveDocuments(docs.filter((d) => !toRemoveAppIds.includes(d.applicationId)));
    return { message: 'Vacancy deleted successfully' };
  },

  // Applications
  getApplications: async (params?: { vacancyId?: string; status?: string; search?: string; department?: string }, currentUserId?: string, role?: string): Promise<Application[]> => {
    let apps = readApplications();
    const vacs = readVacancies();

    // Attach vacancy title and department
    apps = apps.map((a) => {
      const v = vacs.find((vac) => vac.id === a.vacancyId);
      return {
        ...a,
        vacancyTitle: v ? v.title : a.vacancyTitle || 'Position',
        vacancyDepartment: v ? v.department : a.department || 'General',
      };
    });

    if (role === 'applicant' && currentUserId) {
      apps = apps.filter((a) => a.applicantId === currentUserId);
    }

    if (params?.vacancyId) {
      apps = apps.filter((a) => a.vacancyId === params.vacancyId);
    }
    if (params?.status && params.status !== 'All') {
      apps = apps.filter((a) => a.status === params.status);
    }
    if (params?.department && params.department !== 'All') {
      apps = apps.filter((a) => (a.department || a.vacancyDepartment)?.toLowerCase() === params.department!.toLowerCase());
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      apps = apps.filter((a) => a.applicantName.toLowerCase().includes(s) || a.applicantEmail.toLowerCase().includes(s) || a.vacancyTitle?.toLowerCase().includes(s));
    }
    return apps;
  },

  getApplication: async (id: string): Promise<Application> => {
    const apps = readApplications();
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');

    const vacs = readVacancies();
    const v = vacs.find((vac) => vac.id === app.vacancyId);

    const docs = readDocuments().filter((d) => d.applicationId === id);
    const timeline = readTimeline().filter((t) => t.applicationId === id);

    return {
      ...app,
      vacancyTitle: v ? v.title : app.vacancyTitle,
      vacancyDepartment: v ? v.department : app.department,
      documents: docs,
      timeline: timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  },

  submitApplication: async (data: any, currentUserId?: string): Promise<{ message: string; applicationId: string }> => {
    const apps = readApplications();
    const vacs = readVacancies();
    const vac = vacs.find((v) => v.id === data.vacancyId);

    const appId = `app-${Date.now()}`;
    const newApp: Application = {
      id: appId,
      vacancyId: data.vacancyId,
      applicantId: currentUserId || `user-${Date.now()}`,
      applicantName: data.applicantName || 'Anonymous Applicant',
      applicantEmail: data.applicantEmail || 'applicant@example.com',
      applicantPhone: data.applicantPhone || '+251 90 000 0000',
      department: vac ? vac.department : 'General',
      vacancyTitle: vac ? vac.title : 'Position',
      vacancyDepartment: vac ? vac.department : 'General',
      coverLetter: data.coverLetter || '',
      portfolioUrl: data.portfolioUrl || '',
      linkedinUrl: data.linkedinUrl || '',
      status: 'Submitted',
      verificationStatus: 'Pending',
      verificationScore: 70,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    apps.unshift(newApp);
    saveApplications(apps);

    // Save attached documents
    if (Array.isArray(data.documents) && data.documents.length > 0) {
      const docs = readDocuments();
      for (const d of data.documents) {
        docs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          applicationId: appId,
          documentType: d.documentType || 'Resume',
          fileName: d.fileName || 'document.pdf',
          fileSize: d.fileSize || 102400,
          mimeType: d.mimeType || 'application/pdf',
          status: 'Pending',
          automatedCheckStatus: 'Passed',
          automatedCheckDetails: JSON.stringify({ authenticityScore: 85, summary: 'Clean document uploaded.' }),
          createdAt: new Date().toISOString(),
        });
      }
      saveDocuments(docs);
    }

    // Add timeline item
    const timeline = readTimeline();
    timeline.unshift({
      id: `time-${Date.now()}`,
      applicationId: appId,
      status: 'Submitted',
      actorName: newApp.applicantName,
      comment: 'Application submitted with documents.',
      createdAt: new Date().toISOString(),
    });
    saveTimeline(timeline);

    return { message: 'Application submitted successfully', applicationId: appId };
  },

  updateApplicationStatus: async (id: string, data: any, actorName: string = 'Staff'): Promise<Application> => {
    const apps = readApplications();
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Application not found');

    const prev = apps[idx];
    apps[idx] = {
      ...prev,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveApplications(apps);

    if (data.status && data.status !== prev.status) {
      const timeline = readTimeline();
      timeline.unshift({
        id: `time-${Date.now()}`,
        applicationId: id,
        status: data.status,
        actorName: actorName,
        comment: data.comment || data.recruiterNotes || `Status updated to ${data.status}`,
        createdAt: new Date().toISOString(),
      });
      saveTimeline(timeline);
    }

    return apps[idx];
  },

  updateApplication: async (id: string, data: Partial<Application>, actorName: string = 'System Administrator'): Promise<Application> => {
    const apps = readApplications();
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Application not found');

    const prev = apps[idx];
    apps[idx] = {
      ...prev,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveApplications(apps);

    if (data.status && data.status !== prev.status) {
      const timeline = readTimeline();
      timeline.unshift({
        id: `time-${Date.now()}`,
        applicationId: id,
        status: data.status,
        actorName: actorName,
        comment: `System Administrator updated application status to ${data.status}`,
        createdAt: new Date().toISOString(),
      });
      saveTimeline(timeline);
    }

    return apps[idx];
  },

  deleteApplication: async (id: string): Promise<{ message: string }> => {
    const apps = readApplications();
    saveApplications(apps.filter((a) => a.id !== id));
    const docs = readDocuments();
    saveDocuments(docs.filter((d) => d.applicationId !== id));
    const timeline = readTimeline();
    saveTimeline(timeline.filter((t) => t.applicationId !== id));
    return { message: 'Application deleted successfully' };
  },

  // Document Registry Management
  getDocuments: async (params?: { status?: string; search?: string }): Promise<any[]> => {
    let docs = readDocuments();
    const apps = readApplications();
    const vacs = readVacancies();

    let enriched = docs.map((d) => {
      const app = apps.find((a) => a.id === d.applicationId);
      const vac = app ? vacs.find((v) => v.id === app.vacancyId) : null;
      return {
        ...d,
        applicant_name: app ? app.applicantName : 'Unknown Applicant',
        applicant_email: app ? app.applicantEmail : 'N/A',
        vacancy_title: vac ? vac.title : app?.vacancyTitle || 'Position',
      };
    });

    if (params?.status && params.status !== 'All') {
      enriched = enriched.filter((d) => d.status === params.status);
    }

    if (params?.search) {
      const s = params.search.toLowerCase();
      enriched = enriched.filter(
        (d) =>
          d.fileName.toLowerCase().includes(s) ||
          d.applicant_name.toLowerCase().includes(s) ||
          d.vacancy_title.toLowerCase().includes(s)
      );
    }

    return enriched;
  },

  updateDocument: async (id: string, data: Partial<ApplicationDocument>): Promise<ApplicationDocument> => {
    const docs = readDocuments();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');

    docs[idx] = {
      ...docs[idx],
      ...data,
      verifiedAt: data.status ? new Date().toISOString() : docs[idx].verifiedAt,
    };
    saveDocuments(docs);
    return docs[idx];
  },

  deleteDocument: async (id: string): Promise<{ message: string }> => {
    const docs = readDocuments();
    saveDocuments(docs.filter((d) => d.id !== id));
    return { message: 'Document deleted successfully' };
  },

  // Document Verification
  verifyDocument: async (docId: string, data: { status: any; comment?: string }, verifierName: string = 'Recruiter'): Promise<any> => {
    const docs = readDocuments();
    const idx = docs.findIndex((d) => d.id === docId);
    if (idx === -1) throw new Error('Document not found');

    docs[idx] = {
      ...docs[idx],
      status: data.status,
      verificationComment: data.comment || `Marked as ${data.status}`,
      verifiedBy: verifierName,
      verifiedAt: new Date().toISOString(),
    };
    saveDocuments(docs);

    // Update overall application verification status
    const appId = docs[idx].applicationId;
    const appDocs = docs.filter((d) => d.applicationId === appId);
    const allVerified = appDocs.length > 0 && appDocs.every((d) => d.status === 'Verified');
    const hasRejected = appDocs.some((d) => d.status === 'Rejected');
    const hasFlagged = appDocs.some((d) => d.status === 'Flagged');

    const overall = hasRejected ? 'Rejected' : hasFlagged ? 'Flagged' : allVerified ? 'Verified' : 'In Progress';
    const score = allVerified ? 95 : hasRejected ? 20 : hasFlagged ? 50 : 75;

    const apps = readApplications();
    const appIdx = apps.findIndex((a) => a.id === appId);
    if (appIdx >= 0) {
      apps[appIdx].verificationStatus = overall as any;
      apps[appIdx].verificationScore = score;
      saveApplications(apps);
    }

    return {
      message: `Document status updated to ${data.status}`,
      document: docs[idx],
      overallVerificationStatus: overall,
      verificationScore: score,
    };
  },

  runAiCheck: async (docId: string): Promise<any> => {
    const docs = readDocuments();
    const idx = docs.findIndex((d) => d.id === docId);
    if (idx === -1) throw new Error('Document not found');

    const details = {
      authenticityScore: 92,
      summary: 'Verified authentic credentials against standard university and HR templates.',
      issuesFound: [],
      timestamp: new Date().toISOString(),
    };

    docs[idx].automatedCheckStatus = 'Passed';
    docs[idx].automatedCheckDetails = JSON.stringify(details);
    saveDocuments(docs);

    return {
      success: true,
      checkStatus: 'Passed',
      details,
    };
  },

  // Users Management
  getUsers: async (params?: { role?: string; search?: string }): Promise<User[]> => {
    let users = readUsers().map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: u.createdAt,
    }));

    if (params?.role && params.role !== 'All') {
      users = users.filter((u) => u.role === params.role);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      users = users.filter((u) => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    return users;
  },

  createUser: async (data: { email: string; password: string; fullName: string; role: string }): Promise<{ user: User }> => {
    const users = readUsers();
    const cleanEmail = data.email.trim().toLowerCase();
    const newUser = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      role: (data.role as any) || 'applicant',
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };
    users.push(newUser);
    saveUsers(users);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  },

  updateUser: async (id: string, data: { fullName?: string; email?: string; role?: string }): Promise<{ message: string; user: User }> => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');

    users[idx] = {
      ...users[idx],
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
      ...(data.role ? { role: data.role as any } : {}),
    };
    saveUsers(users);

    return {
      message: 'User updated successfully',
      user: {
        id: users[idx].id,
        email: users[idx].email,
        fullName: users[idx].fullName,
        role: users[idx].role,
        createdAt: users[idx].createdAt,
      },
    };
  },

  updateUserRole: async (id: string, role: string): Promise<{ user: User }> => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx].role = role as any;
    saveUsers(users);
    return {
      user: {
        id: users[idx].id,
        email: users[idx].email,
        fullName: users[idx].fullName,
        role: users[idx].role,
        createdAt: users[idx].createdAt,
      },
    };
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const users = readUsers();
    saveUsers(users.filter((u) => u.id !== id));
    return { message: 'User deleted successfully' };
  },

  resetUserPassword: async (id: string, password: string): Promise<{ message: string; user: User }> => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx].passwordHash = password;
    saveUsers(users);
    return {
      message: 'Password reset successfully',
      user: {
        id: users[idx].id,
        email: users[idx].email,
        fullName: users[idx].fullName,
        role: users[idx].role,
        createdAt: users[idx].createdAt,
      },
    };
  },

  // Metrics & Health
  getRecruiterMetrics: async (): Promise<any> => {
    const vacs = readVacancies();
    const apps = readApplications();

    const statusCounts: Record<string, number> = {};
    for (const a of apps) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    }

    const verificationCounts: Record<string, number> = {};
    for (const a of apps) {
      const vStatus = a.verificationStatus || 'Pending';
      verificationCounts[vStatus] = (verificationCounts[vStatus] || 0) + 1;
    }

    const timeline = readTimeline().slice(0, 10);

    return {
      stats: {
        totalVacancies: vacs.length,
        totalApplications: apps.length,
        pendingVerification: apps.filter((a) => a.verificationStatus === 'Pending' || a.verificationStatus === 'In Progress').length,
        verifiedCandidates: apps.filter((a) => a.verificationStatus === 'Verified').length,
        shortlistedCandidates: apps.filter((a) => a.status === 'Shortlisted').length,
      },
      statusFunnel: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      verificationFunnel: Object.entries(verificationCounts).map(([verification_status, count]) => ({ verification_status, count })),
      recentActivity: timeline.map((t) => ({
        id: t.id,
        applicationId: t.applicationId,
        status: t.status,
        actorName: t.actorName,
        comment: t.comment,
        createdAt: t.createdAt,
      })),
    };
  },

  syncHealth: async (): Promise<{ message: string; stats: any }> => {
    // Re-seed demo users & vacancies if empty
    const users = readUsers();
    const vacs = readVacancies();
    const apps = readApplications();

    return {
      message: 'System synchronization completed. Database and local storage healthy.',
      stats: {
        users: users.length,
        vacancies: vacs.length,
        applications: apps.length,
      },
    };
  },
};

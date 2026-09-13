import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Radio, 
  Sparkles, 
  Lock, 
  Building2, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import DocPlatformHeader from '../components/document-platform/DocPlatformHeader';
import DocPlatformSidebar from '../components/document-platform/DocPlatformSidebar';
import DocPlatformDashboard from '../components/document-platform/DocPlatformDashboard';
import DocPlatformSearch from '../components/document-platform/DocPlatformSearch';
import DocPlatformChatRAG from '../components/document-platform/DocPlatformChatRAG';
import DocPlatformFileManager from '../components/document-platform/DocPlatformFileManager';
import DocPlatformWorkspaces from '../components/document-platform/DocPlatformWorkspaces';
import DocPlatformGenerator from '../components/document-platform/DocPlatformGenerator';
import DocPlatformAudit from '../components/document-platform/DocPlatformAudit';
import DocPlatformDetailsModal from '../components/document-platform/DocPlatformDetailsModal';
import SignalementDrawerModal from '../components/document-platform/SignalementDrawerModal';
import TechnicianHiddenModal from '../components/document-platform/TechnicianHiddenModal';
import AuthWelcomeLanding from '../components/auth/AuthWelcomeLanding';
import RegisterWizardModal from '../components/auth/RegisterWizardModal';
import LoginCodeModal from '../components/auth/LoginCodeModal';
import DeviceSecurityModal from '../components/auth/DeviceSecurityModal';
import { useAuth } from '../features/auth/AuthContext';
import { 
  getUserDocuments, 
  saveUserDocuments, 
  getUserAuditLogs, 
  saveUserAuditLogs 
} from '../features/auth/userStorage';
import { INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS } from '../data/mockDocuments';
import { InstitutionDocument, AuditLogEntry } from '../types/documentPlatform';

export default function InstitutionAiPlatformPage() {
  const { user, isAuthenticated, isLoading, loginWithCode } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [documents, setDocuments] = useState<InstitutionDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');
  
  // Modals state
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<InstitutionDocument | null>(null);
  const [isSignalementOpen, setIsSignalementOpen] = useState<boolean>(false);
  const [isTechnicianOpen, setIsTechnicianOpen] = useState<boolean>(false);
  
  // Auth Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);

  // Sync isolated user data whenever authenticated user changes
  useEffect(() => {
    if (user?.id) {
      const userDocs = getUserDocuments(user.id);
      setDocuments(userDocs);
      const userLogs = getUserAuditLogs(user.id);
      setAuditLogs(userLogs);
    } else {
      setDocuments([]);
      setAuditLogs([]);
    }
  }, [user?.id]);

  const handleAddDocument = (newDoc: InstitutionDocument) => {
    if (!user) return;
    // Enforce Sovereign Path Rule #13: r2/users/{supabase_user_uuid}/...
    const sovereignDoc: InstitutionDocument = {
      ...newDoc,
      r2Key: newDoc.r2Key || `r2/users/${user.id}/documents/${newDoc.originalFilename}`,
    };
    const updated = [sovereignDoc, ...documents];
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    handleAddAuditLog('UPLOAD', sovereignDoc.title, `Nouveau document téléversé dans Cloudflare R2 (${sovereignDoc.r2Key})`);
  };

  const handleAddMultipleDocuments = (newDocs: InstitutionDocument[]) => {
    if (!user || newDocs.length === 0) return;
    const sovereignDocs = newDocs.map(doc => ({
      ...doc,
      r2Key: doc.r2Key || `r2/users/${user.id}/documents/${doc.originalFilename}`,
    }));
    const updated = [...sovereignDocs, ...documents];
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    handleAddAuditLog(
      'UPLOAD',
      `${newDocs.length} documents ingérés`,
      `Lot de ${newDocs.length} documents multi-formats indexés dans Cloudflare R2 & Qdrant`
    );
  };

  const handleDeleteDocument = (docId: string) => {
    if (!user) return;
    const doc = documents.find(d => d.id === docId);
    const updated = documents.filter(d => d.id !== docId);
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    if (doc) {
      handleAddAuditLog('PERMISSION_CHECK', doc.title, `Document supprimé du coffre-fort R2 par l'agent habilité`);
    }
  };

  const handleAddAuditLog = (action: any, title: string, details: string) => {
    if (!user) return;
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      action: action,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      resourceTitle: title,
      timestamp: new Date().toISOString(),
      ipAddress: '10.15.2.14',
      rlsVerified: true,
      details: details
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveUserAuditLogs(user.id, updated);
  };

  const handleAskAi = (promptText: string) => {
    setChatInitialPrompt(promptText);
    setActiveTab('chat');
  };

  const handleQuickDemoLogin = async () => {
    await loginWithCode('123456', 'agent.driss@cniplc.dj');
  };

  // 1. FIRST VISIT / NON-AUTHENTICATED: Display mandated welcome landing screen
  if (!isLoading && !isAuthenticated) {
    return (
      <>
        <AuthWelcomeLanding
          onCreateSpace={() => setIsRegisterOpen(true)}
          onLogin={() => setIsLoginOpen(true)}
          onQuickDemoLogin={handleQuickDemoLogin}
          onOpenSignalement={() => setIsSignalementOpen(true)}
          onOpenTechnician={() => setIsTechnicianOpen(true)}
        />

        {/* Auth Modals */}
        <RegisterWizardModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={() => {
            setIsRegisterOpen(false);
          }}
          onSwitchToLogin={() => {
            setIsRegisterOpen(false);
            setIsLoginOpen(true);
          }}
        />

        <LoginCodeModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSuccess={() => {
            setIsLoginOpen(false);
          }}
          onSwitchToRegister={() => {
            setIsLoginOpen(false);
            setIsRegisterOpen(true);
          }}
        />

        {/* Platform Modals accessible from landing page */}
        <SignalementDrawerModal
          isOpen={isSignalementOpen}
          onClose={() => setIsSignalementOpen(false)}
        />

        <TechnicianHiddenModal
          isOpen={isTechnicianOpen}
          onClose={() => setIsTechnicianOpen(false)}
        />
      </>
    );
  }

  // 2. AUTHENTICATED: Display dedicated sovereign institutional document workspace
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Institutional Header */}
      <DocPlatformHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Main Container with Sidebar + Dynamic Views */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10">
        {/* Navigation Sidebar */}
        <DocPlatformSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          documentCount={documents.length}
          onOpenSecurity={() => setIsSecurityOpen(true)}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DocPlatformDashboard
              documents={documents}
              onSelectTab={setActiveTab}
              onSelectDocument={setSelectedDocForDetails}
              onAskAiPrompt={handleAskAi}
              onTriggerUpload={() => setActiveTab('documents')}
              onAddDocument={handleAddDocument}
              onAddMultipleDocuments={handleAddMultipleDocuments}
            />
          )}

          {activeTab === 'search' && (
            <DocPlatformSearch
              documents={documents}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectDocument={setSelectedDocForDetails}
              onAskAiPrompt={handleAskAi}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'chat' && (
            <DocPlatformChatRAG
              documents={documents}
              initialPrompt={chatInitialPrompt}
              onExportDocx={(title, content) => {
                setActiveTab('generator');
              }}
              onExportPdf={(title, content) => {
                setActiveTab('generator');
              }}
            />
          )}

          {activeTab === 'documents' && (
            <DocPlatformFileManager
              documents={documents}
              onAddDocument={handleAddDocument}
              onAddMultipleDocuments={handleAddMultipleDocuments}
              onDeleteDocument={handleDeleteDocument}
              onSelectDocument={setSelectedDocForDetails}
            />
          )}

          {activeTab === 'workspaces' && (
            <DocPlatformWorkspaces
              documents={documents}
              onSelectDocument={setSelectedDocForDetails}
              onAskAiPrompt={handleAskAi}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'generator' && (
            <DocPlatformGenerator
              documents={documents}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeTab === 'audit' && (
            <DocPlatformAudit logs={auditLogs} />
          )}
        </main>
      </div>

      {/* Institutional Footer */}
      <footer className="border-t border-white/5 py-4 px-6 bg-slate-950/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} CNIPLC — République de Djibouti. Tous droits réservés.</span>
          <span>•</span>
          <span>Plateforme IA Documentaire Sécurisée</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSecurityOpen(true)}
            className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Sécurité &amp; Appareils</span>
          </button>
        </div>
      </footer>

      {/* Platform Modals */}
      <SignalementDrawerModal
        isOpen={isSignalementOpen}
        onClose={() => setIsSignalementOpen(false)}
      />

      <TechnicianHiddenModal
        isOpen={isTechnicianOpen}
        onClose={() => setIsTechnicianOpen(false)}
      />

      <DocPlatformDetailsModal
        docItem={selectedDocForDetails}
        onClose={() => setSelectedDocForDetails(null)}
        onAskAi={(docTitle) => {
          handleAskAi(`En te basant sur le document "${docTitle}", donne-moi une analyse détaillée.`);
        }}
      />

      {/* Security & Devices Modal (Section 9 & 10) */}
      <DeviceSecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Login / Register fallback Modals if user wants to switch */}
      <RegisterWizardModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <LoginCodeModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />
    </div>
  );
}


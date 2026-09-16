import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Radio, 
  Sparkles, 
  Lock, 
  Building2, 
  Terminal,
  ExternalLink,
  ArrowRight,
  X,
  Search,
  Bot
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
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [showLoginAiBanner, setShowLoginAiBanner] = useState<boolean>(false);
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

  // Check if user recently logged in with code to display quick access prompt
  useEffect(() => {
    if (isAuthenticated && sessionStorage.getItem('cniplc_code_login_success') === 'true') {
      setShowLoginAiBanner(true);
      sessionStorage.removeItem('cniplc_code_login_success');
    }
  }, [isAuthenticated]);

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setPreviousTab(activeTab);
      setActiveTab(newTab);
    }
  };

  const handleQuickJumpToAi = () => {
    if (activeTab === 'chat') {
      if (previousTab && previousTab !== 'chat') {
        setActiveTab(previousTab);
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setPreviousTab(activeTab);
      setActiveTab('chat');
    }
  };

  const handleQuickJumpToSearch = () => {
    if (activeTab === 'search') {
      if (previousTab && previousTab !== 'search') {
        setActiveTab(previousTab);
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setPreviousTab(activeTab);
      setActiveTab('search');
    }
  };

  // Keyboard Shortcuts (Alt+A for AI Chat, Alt+S for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleQuickJumpToAi();
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleQuickJumpToSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, previousTab]);

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
    const sovereignDoc: InstitutionDocument = {
      ...newDoc,
      storagePath: newDoc.storagePath || `/storage/users/${user.id}/documents/${newDoc.originalFilename}`,
      r2Key: newDoc.r2Key || `/storage/users/${user.id}/documents/${newDoc.originalFilename}`,
      chromaVectorCount: newDoc.chromaVectorCount || 10,
    };
    const updated = [sovereignDoc, ...documents];
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    handleAddAuditLog('UPLOAD', sovereignDoc.title, `Nouveau document enregistré dans le stockage local (${sovereignDoc.storagePath}) & indexé ChromaDB`);
  };

  const handleAddMultipleDocuments = (newDocs: InstitutionDocument[]) => {
    if (!user || newDocs.length === 0) return;
    const sovereignDocs = newDocs.map(doc => ({
      ...doc,
      storagePath: doc.storagePath || `/storage/users/${user.id}/documents/${doc.originalFilename}`,
      r2Key: doc.r2Key || `/storage/users/${user.id}/documents/${doc.originalFilename}`,
      chromaVectorCount: doc.chromaVectorCount || 10,
    }));
    const updated = [...sovereignDocs, ...documents];
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    handleAddAuditLog(
      'UPLOAD',
      `${newDocs.length} documents ingérés`,
      `Lot de ${newDocs.length} documents multi-formats indexés dans le Stockage Local & ChromaDB`
    );
  };

  const handleDeleteDocument = (docId: string) => {
    if (!user) return;
    const doc = documents.find(d => d.id === docId);
    const updated = documents.filter(d => d.id !== docId);
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
    if (doc) {
      handleAddAuditLog('PERMISSION_CHECK', doc.title, `Document archivé/supprimé du stockage local par l'agent habilité`);
    }
  };

  const handleUpdateDocument = (updatedDoc: InstitutionDocument) => {
    if (!user) return;
    const updated = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    setDocuments(updated);
    saveUserDocuments(user.id, updated);
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
        previousTab={previousTab}
        onSelectTab={handleTabChange}
        onQuickJumpToAi={handleQuickJumpToAi}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Floating Instant AI Access Prompt Banner after Login with Code */}
      {showLoginAiBanner && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 lg:px-8 pt-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-blue-500/15 border border-amber-500/30 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Connexion réussie • Assistant IA & Recherche Sémantique</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Prêt</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Accédez instantanément au corpus documentaire officiel avec l'assistant RAG ou effectuez une recherche sémantique sans perdre votre vue actuelle.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setShowLoginAiBanner(false);
                  handleQuickJumpToSearch();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-white/10 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recherche Sémantique</span>
              </button>

              <button
                onClick={() => {
                  setShowLoginAiBanner(false);
                  handleQuickJumpToAi();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-slate-950 transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-slate-950" />
                <span>Assistant IA (RAG)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <button
                onClick={() => setShowLoginAiBanner(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Masquer cette notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Container with Sidebar + Dynamic Views */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10">
        {/* Navigation Sidebar */}
        <DocPlatformSidebar
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          documentCount={documents.length}
          onOpenSecurity={() => setIsSecurityOpen(true)}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DocPlatformDashboard
              documents={documents}
              onSelectTab={handleTabChange}
              onSelectDocument={setSelectedDocForDetails}
              onAskAiPrompt={handleAskAi}
              onTriggerUpload={() => handleTabChange('documents')}
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
              onSelectTab={handleTabChange}
            />
          )}

          {activeTab === 'chat' && (
            <DocPlatformChatRAG
              documents={documents}
              initialPrompt={chatInitialPrompt}
              onExportDocx={(title, content) => {
                handleTabChange('generator');
              }}
              onExportPdf={(title, content) => {
                handleTabChange('generator');
              }}
            />
          )}

          {activeTab === 'documents' && (
            <DocPlatformFileManager
              documents={documents}
              onAddDocument={handleAddDocument}
              onAddMultipleDocuments={handleAddMultipleDocuments}
              onDeleteDocument={handleDeleteDocument}
              onUpdateDocument={handleUpdateDocument}
              onSelectDocument={setSelectedDocForDetails}
            />
          )}

          {activeTab === 'workspaces' && (
            <DocPlatformWorkspaces
              documents={documents}
              onSelectDocument={setSelectedDocForDetails}
              onAskAiPrompt={handleAskAi}
              onSelectTab={handleTabChange}
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


import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Package,
  MapPin,
  FileText,
  Droplet,
  Award,
  MessageSquare,
  Filter,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Unlock,
  Lock,
  Loader2,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// FUNÇÃO UTILITÁRIA PARA CÁLCULO DE PERÍODO (Dia 21 ao Dia 20)
// ============================================================================
const calcularPeriodoViagem = (dataStr) => {
  if (!dataStr) return '';
  try {
    const [anoStr, mesStr, diaStr] = dataStr.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10);
    const dia = parseInt(diaStr, 10);

    // Se o dia for >= 21, pertence à competência (mês) seguinte
    if (dia >= 21) {
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
    }
    return `${mes.toString().padStart(2, '0')}/${ano}`;
  } catch (e) {
    return '';
  }
};

// ============================================================================
// CONFIGURAÇÃO REAL DO SUPABASE
// ============================================================================
const supabaseUrl = 'https://dwlcaplumgtgvbducrev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bGNhcGx1bWd0Z3ZiZHVjcmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzY5NDMsImV4cCI6MjA2MjQxMjk0M30.8oGZIvEIruVdOjuMT-oPtgOGLh_QgfR3XV07V3AOe40';
let supabase = null; 

export default function App() {
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [viagens, setViagens] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [resumos, setResumos] = useState([]);
  const [diesel, setDiesel] = useState([]);
  const [premiosLiberados, setPremiosLiberados] = useState(false);
  const [correcoesBloqueadas, setCorrecoesBloqueadas] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Injeta Tailwind de forma segura para ambientes de pré-visualização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('google-fonts-inter')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'google-fonts-inter';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        
        const style = document.createElement('style');
        style.innerHTML = `body { font-family: 'Inter', sans-serif; }`;
        document.head.appendChild(style);
      }
      if (!document.getElementById('tailwind-script')) {
        const tw = document.createElement('script');
        tw.id = 'tailwind-script';
        tw.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tw);
      }

      // Supabase
      if (!document.getElementById('supabase-script')) {
        const supaScript = document.createElement('script');
        supaScript.id = 'supabase-script';
        supaScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        supaScript.onload = () => {
          if (window.supabase && !supabase) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            setSupabaseReady(true);
          }
        };
        document.head.appendChild(supaScript);
      } else if (window.supabase && !supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabaseReady(true);
      }
    }
  }, []);

  const fetchData = async () => {
    if (!currentUser || !supabaseReady) return;
    setIsLoadingData(true);

    try {
      const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
      if (configData) {
        setPremiosLiberados(configData.premios_liberados);
        setCorrecoesBloqueadas(configData.correcoes_bloqueadas);
      }

      if (currentUser.admin) {
        const [resViagens, resPendentes] = await Promise.all([
          supabase.from('minhas_viagens').select('*').order('data', { ascending: false }),
          supabase.from('viagens_pendentes').select('*').order('data', { ascending: false })
        ]);
        if (resViagens.data) setViagens(resViagens.data);
        if (resPendentes.data) setPendentes(resPendentes.data);
      } else {
        const [resViagens, resPendentes, resResumo, resDiesel] = await Promise.all([
          supabase.from('minhas_viagens').select('*').eq('email', currentUser.email).order('data', { ascending: false }),
          supabase.from('viagens_pendentes').select('*').eq('email', currentUser.email).order('data', { ascending: false }),
          supabase.from('resumo').select('*').eq('email', currentUser.email),
          supabase.from('diesel').select('*').eq('email', currentUser.email)
        ]);
        if (resViagens.data) setViagens(resViagens.data);
        if (resPendentes.data) setPendentes(resPendentes.data);
        if (resResumo.data) setResumos(resResumo.data);
        if (resDiesel.data) setDiesel(resDiesel.data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (supabaseReady) {
      fetchData();
    }
  }, [currentUser, supabaseReady]);

  if (!supabaseReady) {
    return (
      <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-blue-600">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-semibold text-slate-500 tracking-wide text-sm uppercase">A preparar o sistema...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} supabase={supabase} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-800 font-sans selection:bg-blue-200">
      {/* Header Premium (Claro com Gradiente Vibrante) */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-500 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center relative overflow-hidden">
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/30 shadow-sm">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              BD <span className="text-teal-200">FLOW</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <div className="hidden sm:flex items-center bg-white/10 border border-white/20 px-4 py-2 rounded-xl backdrop-blur-md shadow-inner">
              <div className="w-2 h-2 rounded-full bg-teal-300 mr-2 animate-pulse shadow-[0_0_8px_rgba(94,234,212,0.8)]"></div>
              <span className="text-sm font-medium text-white drop-shadow-sm">
                {currentUser.admin ? 'Fidelidade' : currentUser.motorista}
              </span>
            </div>
            <button 
              onClick={() => setCurrentUser(null)}
              className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all duration-300 border border-white/20 hover:border-rose-400 shadow-sm"
              title="Sair"
            >
              <LogOut className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline text-sm font-semibold">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
        {isLoadingData && (
          <div className="absolute inset-0 bg-[#F4F7F9]/70 backdrop-blur-sm z-50 flex justify-center items-start pt-20 rounded-3xl">
             <div className="flex items-center space-x-3 text-blue-600 bg-white px-6 py-4 rounded-2xl shadow-xl border border-blue-50 ring-1 ring-blue-100/50">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span className="font-semibold">A sincronizar dados em tempo real...</span>
             </div>
          </div>
        )}

        {currentUser.admin ? (
          <AdminDashboard 
            viagens={viagens} setViagens={setViagens} 
            pendentes={pendentes} setPendentes={setPendentes} 
            premiosLiberados={premiosLiberados} setPremiosLiberados={setPremiosLiberados} 
            correcoesBloqueadas={correcoesBloqueadas} setCorrecoesBloqueadas={setCorrecoesBloqueadas}
            refreshData={fetchData}
            supabase={supabase}
          />
        ) : (
          <DriverDashboard 
            currentUser={currentUser} 
            viagens={viagens} setViagens={setViagens} 
            pendentes={pendentes} setPendentes={setPendentes} 
            resumos={resumos} diesel={diesel} 
            premiosLiberados={premiosLiberados} 
            correcoesBloqueadas={correcoesBloqueadas}
            refreshData={fetchData}
            supabase={supabase}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// COMPONENTE: TELA DE LOGIN (Design Claro)
// ============================================================================
function LoginScreen({ onLogin, supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error('Credenciais inválidas. Verifique os seus dados.');

      const { data: profile, error: profileError } = await supabase
        .from('motoristas_cadastrados')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profile) throw new Error('Perfil não encontrado.');

      onLogin({ ...authData.user, ...profile });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Background Decorativo Claro */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-teal-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-white backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100 relative z-10">
        <div className="pt-12 pb-6 text-center px-6">
          <div className="inline-flex bg-gradient-to-br from-blue-600 to-teal-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20 mb-6">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">BD FLOW</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Logística & Fidelidade Operacional</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 pt-2 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm flex items-start space-x-3 border border-rose-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">Login </label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">Senha</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white py-4 px-4 rounded-2xl transition-all font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
          >
            {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Aceder ao Painel</span>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PAINEL DO MOTORISTA
// ============================================================================
function DriverDashboard({ currentUser, viagens, setViagens, pendentes, setPendentes, resumos, diesel, premiosLiberados, correcoesBloqueadas, refreshData, supabase }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtroCompetencia, setFiltroCompetencia] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroDiesel, setFiltroDiesel] = useState('');

  // Prepara o Histórico mapeando o período exato (dia 21 a 20)
  const historicoComPeriodo = useMemo(() => {
    const confirmadas = viagens.filter(v => v.email === currentUser.email);
    const enviadas = pendentes.filter(p => p.email === currentUser.email && p.status !== 'Aprovado');
    const todos = [...confirmadas, ...enviadas].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return todos.map(item => ({
      ...item,
      _periodo: calcularPeriodoViagem(item.data)
    }));
  }, [viagens, pendentes, currentUser.email]);

  // Lista de Meses disponíveis nos Resumos (Impo/Expo/Prémio)
  const competenciasResumoDisponiveis = useMemo(() => {
    const c1 = resumos.filter(r => r.email === currentUser.email).map(r => r.mes || r.competencia);
    return [...new Set(c1.filter(Boolean))].sort((a, b) => {
      const [m1, y1] = a.split('/');
      const [m2, y2] = b.split('/');
      if (y1 !== y2) return (Number(y2) || 0) - (Number(y1) || 0);
      return (Number(m2) || 0) - (Number(m1) || 0);
    });
  }, [resumos, currentUser.email]);

  // Lista de Meses disponíveis no Diesel
  const competenciasDieselDisponiveis = useMemo(() => {
    const c2 = diesel.filter(d => d.email === currentUser.email).map(d => d.competencia || d.mes);
    return [...new Set(c2.filter(Boolean))].sort((a, b) => {
      const [m1, y1] = a.split('/');
      const [m2, y2] = b.split('/');
      if (y1 !== y2) return (Number(y2) || 0) - (Number(y1) || 0);
      return (Number(m2) || 0) - (Number(m1) || 0);
    });
  }, [diesel, currentUser.email]);

  // Lista de Períodos (21 a 20) disponíveis no Histórico
  const periodosDisponiveis = useMemo(() => {
    const periodos = historicoComPeriodo.map(item => item._periodo).filter(Boolean);
    return [...new Set(periodos)].sort((a, b) => {
      const [m1, y1] = a.split('/');
      const [m2, y2] = b.split('/');
      if (y1 !== y2) return (Number(y2) || 0) - (Number(y1) || 0);
      return (Number(m2) || 0) - (Number(m1) || 0);
    });
  }, [historicoComPeriodo]);

  // Filtra as Estatísticas Gerais (Resumo)
  const meuResumo = useMemo(() => {
    const driverResumos = resumos.filter(r => r.email === currentUser.email);
    if (filtroCompetencia) return driverResumos.find(r => r.mes === filtroCompetencia || r.competencia === filtroCompetencia) || driverResumos[0] || {};
    return driverResumos[0] || {};
  }, [resumos, currentUser.email, filtroCompetencia]);

  // Filtra a Estatística específica do Diesel
  const meuDiesel = useMemo(() => {
    const driverDiesel = diesel.filter(d => d.email === currentUser.email);
    if (filtroDiesel) return driverDiesel.find(d => d.competencia === filtroDiesel || d.mes === filtroDiesel) || driverDiesel[0] || {};
    return driverDiesel[0] || {};
  }, [diesel, currentUser.email, filtroDiesel]);
  
  // Filtra as Viagens com base no Período selecionado
  const historicoFiltrado = useMemo(() => {
    if (!filtroPeriodo) return historicoComPeriodo;
    return historicoComPeriodo.filter(item => item._periodo === filtroPeriodo);
  }, [historicoComPeriodo, filtroPeriodo]);

  const handleAddTrip = async (newTripData) => {
    const novaPendente = {
      user_id: currentUser.id,
      email: currentUser.email,
      nome: currentUser.motorista,
      status: 'Em Análise', 
      resposta: null,
      ...newTripData
    };

    const { error } = await supabase.from('viagens_pendentes').insert([novaPendente]);
    if (error) alert("Erro ao enviar solicitação para a base de dados.");
    else { refreshData(); setShowAddModal(false); }
  };

  const handleConferirViagem = async (item) => {
    const isChecked = ['confirmada', 'Aprovada', 'Aprovado'].includes(item.status);
    const novoStatus = isChecked ? (item.mes ? 'Pendente' : 'Pendente') : 'confirmada';

    const isPendenteTable = pendentes.some(p => p.id === item.id);
    if (isPendenteTable) {
      setPendentes(pendentes.map(p => p.id === item.id ? { ...p, status: novoStatus } : p));
    } else {
      setViagens(viagens.map(v => v.id === item.id ? { ...v, status: novoStatus } : v));
    }

    const tableToUpdate = isPendenteTable ? 'viagens_pendentes' : 'minhas_viagens';
    const { error } = await supabase.from(tableToUpdate).update({ status: novoStatus }).eq('id', item.id);
    if (error) refreshData();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section & Filtro de Desempenho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Olá, {currentUser.motorista.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Aqui está o resumo da sua performance.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60 w-full sm:w-auto">
          <Award className="w-5 h-5 text-teal-500 flex-shrink-0" />
          <select 
            value={filtroCompetencia} 
            onChange={e => setFiltroCompetencia(e.target.value)} 
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
          >
            <option value="">Desempenho (Todos)</option>
            {competenciasResumoDisponiveis.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={<FileText className="h-6 w-6" />} color="blue" 
          title="Impo / Expo" value={`${meuResumo.impo || 0} / ${meuResumo.expo || 0}`} 
        />
        <StatCard 
          icon={<Package className="h-6 w-6" />} color="indigo" 
          title="Extras / Total" value={meuResumo.extra || 0} subtitle={`(${meuResumo.total_viagens || 0} viagens)`} 
        />
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300 group flex items-start space-x-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="bg-teal-50 text-teal-600 p-3.5 sm:p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[56px]">
            <p className="text-sm text-slate-500 font-semibold mb-0.5 truncate">Prémio Atual</p>
            {premiosLiberados ? (
              <p className="text-2xl font-black text-teal-600 tracking-tight truncate">{meuResumo.premio || 'R$ 0,00'}</p>
            ) : (
              <p className="text-[11px] font-bold text-slate-400 leading-snug">Calculado após as correções</p>
            )}
          </div>
        </div>
        <StatCard 
          icon={<Droplet className="h-6 w-6" />} color="cyan" 
          title="Média Diesel" value={meuDiesel.media || '0.00'} subtitle="km/L"
          extraContent={
            <div className="relative mt-2">
              <select 
                value={filtroDiesel} 
                onChange={e => setFiltroDiesel(e.target.value)} 
                className="w-full text-[11px] font-bold text-cyan-700 bg-cyan-50/50 border border-cyan-100/80 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer appearance-none pr-6"
              >
                <option value="">Última Competência</option>
                {competenciasDieselDisponiveis.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-3 h-3 text-cyan-600 rotate-90" />
              </div>
            </div>
          }
        />
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row justify-end">
         {correcoesBloqueadas ? (
            <div className="w-full sm:max-w-lg bg-blue-50/80 border border-blue-200/60 text-blue-800 p-5 rounded-2xl shadow-sm text-sm backdrop-blur-sm">
               <p className="font-bold flex items-center mb-1.5 text-blue-900 text-base"><AlertCircle className="w-5 h-5 mr-2 text-blue-600"/> Prazo Encerrado</p>
               <p className="font-medium text-blue-700/90 leading-relaxed">O envio de correções está suspenso. Novas correções entrarão no ciclo da próxima premiação.</p>
            </div>
         ) : (
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto group flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-7 py-3.5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg font-bold transform hover:-translate-y-1"
            >
              <Plus className="h-5 w-5 text-teal-200 group-hover:rotate-90 transition-transform duration-300" />
              <span>Faltou uma viagem?</span>
            </button>
         )}
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Histórico de Movimentações</h3>
            <span className="text-sm font-semibold text-slate-400">{historicoFiltrado.length} registos encontrados</span>
          </div>
          
          {/* Filtro Específico para Viagens (Período 21 a 20) */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200/60 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <select 
              value={filtroPeriodo} 
              onChange={e => setFiltroPeriodo(e.target.value)} 
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
            >
              <option value="">Filtro de Período (21 a 20)</option>
              {periodosDisponiveis.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        
        {historicoFiltrado.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="bg-blue-50 p-6 rounded-full mb-4"><Truck className="h-10 w-10 text-blue-300" /></div>
            <p className="text-slate-500 font-medium text-lg">Sem registos no período selecionado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {historicoFiltrado.map(item => {
              const isEmAnalise = item.status === 'Em Análise' || item.status === 'inclusa';
              const isReprovado = item.status === 'Reprovado';
              const isBlockCheckbox = isEmAnalise || isReprovado;
              const isChecked = ['confirmada', 'Aprovada', 'Aprovado'].includes(item.status);

              return (
                <li key={item.id} className="p-4 sm:p-6 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    <div className="flex items-start space-x-4">
                      <div className="pt-1.5 flex-shrink-0">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            disabled={isBlockCheckbox}
                            onChange={() => handleConferirViagem(item)}
                            className={`peer appearance-none w-6 h-6 border-2 rounded-lg transition-all duration-300 ${
                              isBlockCheckbox 
                                ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' 
                                : 'bg-white border-slate-300 checked:bg-blue-500 checked:border-blue-500 cursor-pointer hover:border-blue-400'
                            }`}
                          />
                          <CheckCircle className={`absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-300 ${isBlockCheckbox ? 'hidden' : ''}`} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <span className="font-bold text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                            {item.origem} <ChevronRight className="inline w-4 h-4 text-slate-300 mx-0.5" /> {item.destino}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        
                        <div className="text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                          <span className="flex items-center bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100" title="Período de Faturação">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400"/> 
                            {new Date(item.data).toLocaleDateString('pt-BR')} <span className="text-slate-400 ml-1">({item._periodo})</span>
                          </span>
                          <span className="flex items-center bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><Package className="w-3.5 h-3.5 mr-1.5 text-teal-400"/> {item.container || 'S/ Contentor'}</span>
                          <span className="flex items-center bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400"/> {item.tipo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mensagens / Respostas */}
                    {(item.resposta || (isEmAnalise && item.mensagem)) && (
                      <div className={`p-4 rounded-2xl text-sm flex items-start space-x-3 lg:max-w-xs w-full border ${
                        item.status === 'Reprovado' 
                          ? 'bg-rose-50/50 text-rose-800 border-rose-100' 
                          : isEmAnalise 
                            ? 'bg-blue-50/50 text-blue-800 border-blue-100'
                            : 'bg-teal-50/50 text-teal-800 border-teal-100'
                      }`}>
                        <div className="mt-0.5">
                          {item.status === 'Reprovado' ? <XCircle className="w-5 h-5 text-rose-500" /> : 
                           isEmAnalise ? <MessageSquare className="w-5 h-5 text-blue-500" /> :
                           <CheckCircle className="w-5 h-5 text-teal-500" />}
                        </div>
                        <div>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            item.status === 'Reprovado' ? 'text-rose-500' : isEmAnalise ? 'text-blue-500' : 'text-teal-600'
                          }`}>
                            {item.status === 'Reprovado' ? 'Recusado por' : isEmAnalise ? 'Sua Mensagem' : 'Nota da Fidelidade'}
                          </span>
                          <p className="font-medium leading-relaxed">{item.resposta || item.mensagem}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showAddModal && <AddTripModal currentUser={currentUser} onClose={() => setShowAddModal(false)} onSave={handleAddTrip} supabase={supabase} />}
    </div>
  );
}

// Pequeno Componente para os Cards
function StatCard({ icon, color, title, value, subtitle, extraContent }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  };
  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300 group flex items-start space-x-4">
      <div className={`${colors[color]} p-3.5 sm:p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[56px]">
        <p className="text-sm text-slate-500 font-semibold mb-0.5 truncate">{title}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight truncate">
          {value} {subtitle && <span className="text-sm font-medium text-slate-400 ml-1">{subtitle}</span>}
        </p>
        {extraContent}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: PAINEL DO ADMIN (Setor de Fidelidade)
// ============================================================================
function AdminDashboard({ viagens, setViagens, pendentes, setPendentes, premiosLiberados, setPremiosLiberados, correcoesBloqueadas, setCorrecoesBloqueadas, refreshData, supabase }) {
  const [activeTab, setActiveTab] = useState('Em Análise'); 
  const [actionState, setActionState] = useState({ id: null, type: null }); 
  const [actionMessage, setActionMessage] = useState('');
  const [viewImageUrl, setViewImageUrl] = useState(null);

  const [sortBy, setSortBy] = useState('data_desc');
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterMes, setFilterMes] = useState('');

  const aguardando = pendentes.filter(p => p.status === 'Em Análise');
  const historico = pendentes.filter(p => p.status !== 'Em Análise');

  const aguardandoSorted = useMemo(() => {
    let list = [...aguardando];
    if (sortBy === 'data_desc') list.sort((a, b) => new Date(b.data) - new Date(a.data));
    if (sortBy === 'data_asc') list.sort((a, b) => new Date(a.data) - new Date(b.data));
    if (sortBy === 'nome_asc') list.sort((a, b) => a.nome.localeCompare(b.nome));
    if (sortBy === 'nome_desc') list.sort((a, b) => b.nome.localeCompare(a.nome));
    return list;
  }, [aguardando, sortBy]);

  const uniqueMotoristas = useMemo(() => [...new Set(viagens.map(v => v.motorista))], [viagens]);
  const uniqueMeses = useMemo(() => [...new Set(viagens.map(v => v.mes))], [viagens]);

  const todasViagensFiltradas = useMemo(() => {
    return viagens.filter(v => {
      const matchMotorista = filterMotorista ? v.motorista === filterMotorista : true;
      const matchMes = filterMes ? v.mes === filterMes : true;
      return matchMotorista && matchMes;
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [viagens, filterMotorista, filterMes]);

  let displayedTrips = activeTab === 'Em Análise' ? aguardandoSorted : activeTab === 'historico' ? historico : todasViagensFiltradas;

  // Funções globais
  const handleToggleBloqueio = async () => {
    const novoValor = !correcoesBloqueadas;
    setCorrecoesBloqueadas(novoValor); 
    await supabase.from('configuracoes').update({ correcoes_bloqueadas: novoValor }).eq('id', 1);
  };

  const handleTogglePremios = async () => {
    const novoValor = !premiosLiberados;
    setPremiosLiberados(novoValor); 
    await supabase.from('configuracoes').update({ premios_liberados: novoValor }).eq('id', 1);
  };

  const confirmAction = async (item) => {
    if (actionState.type === 'reject' && !actionMessage.trim()) {
      alert("Por favor, insira o motivo da reprovação."); return;
    }

    if (actionState.type === 'approve') {
      await supabase.from('viagens_pendentes').update({ status: 'Aprovado', resposta: actionMessage || null }).eq('id', item.id);
      
      const mesFormatado = calcularPeriodoViagem(item.data);
      await supabase.from('minhas_viagens').insert([{
        email: item.email, origem: item.origem, destino: item.destino, container: item.container,
        data: item.data, status: 'Aprovada', motorista: item.nome, mes: mesFormatado, tipo: item.tipo, resposta: actionMessage || null
      }]);
    } else {
      await supabase.from('viagens_pendentes').update({ status: 'Reprovado', resposta: actionMessage }).eq('id', item.id);
    }

    setActionState({ id: null, type: null });
    setActionMessage('');
    refreshData();
  };

  const toggleSort = (type) => setSortBy(sortBy === `${type}_desc` ? `${type}_asc` : `${type}_desc`);

  return (
    <div className="space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Controlo</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Faça a gestão das solicitações e operações da frota.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={handleToggleBloqueio}
            className={`flex items-center justify-center space-x-2.5 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm border ${
              correcoesBloqueadas 
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 ring-4 ring-blue-500/10' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {correcoesBloqueadas ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            <span>{correcoesBloqueadas ? 'Correções Bloqueadas' : 'Bloquear Correções'}</span>
          </button>

          <button
            onClick={handleTogglePremios}
            className={`flex items-center justify-center space-x-2.5 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm border ${
              premiosLiberados 
                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 ring-4 ring-teal-500/10' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {premiosLiberados ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            <span>{premiosLiberados ? 'Prémios Visíveis' : 'Libertar Prémios (Oculto)'}</span>
          </button>
        </div>
      </div>

      {/* Modern Segmented Tabs */}
      <div className="bg-white p-1.5 rounded-2xl flex overflow-x-auto hide-scrollbar border border-slate-200 shadow-sm w-fit">
        {[
          { id: 'Em Análise', label: 'Pendentes', badge: aguardando.length },
          { id: 'historico', label: 'Histórico' },
          { id: 'todas', label: 'Base Completa' },
          { id: 'importar', label: 'Importar Lotes', icon: <FileSpreadsheet className="w-4 h-4 mr-2" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        
        {/* Aba de Importação */}
        {activeTab === 'importar' && (
          <div className="p-10">
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-800">Sincronização em Lote</h3>
                <p className="text-slate-500 mt-2 font-medium">Faça o upload de ficheiros (.csv ou .xlsx) para atualizar os sistemas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Base de Viagens', sub: 'Histórico consolidado', icon: <Truck />, color: 'blue' },
                  { title: 'Base de Resumos', sub: 'Impo, Expo e Prémios', icon: <Award />, color: 'teal' },
                  { title: 'Base de Diesel', sub: 'Médias de consumo (km/L)', icon: <Droplet />, color: 'cyan' }
                ].map((card, i) => (
                  <div key={i} className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className={`bg-${card.color}-50 text-${card.color}-600 p-4 rounded-2xl mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                      {React.cloneElement(card.icon, { className: 'w-7 h-7' })}
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{card.title}</h4>
                    <p className="text-sm text-slate-400 mb-6 font-medium">{card.sub}</p>
                    <button className={`text-sm font-bold text-${card.color}-700 bg-${card.color}-50/50 border border-${card.color}-100 px-5 py-2.5 rounded-xl group-hover:bg-${card.color}-100 transition-colors w-full`}>
                      Selecionar
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl flex items-start space-x-3 border border-blue-100">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                  <strong>Nota de Integração:</strong> Ao selecionar um ficheiro, utilize a função de upload do Supabase ou integre o `papaparse` para leitura em memória antes do upsert.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ferramentas de Tabela */}
        {activeTab === 'Em Análise' && displayedTrips.length > 0 && (
          <div className="flex items-center space-x-3 p-5 bg-slate-50/50 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center mr-2">
               Ordenar:
            </span>
            <button onClick={() => toggleSort('data')} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center ${sortBy.includes('data') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Data Envio <ArrowUpDown className="w-3 h-3 ml-1.5 opacity-50"/>
            </button>
            <button onClick={() => toggleSort('nome')} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center ${sortBy.includes('nome') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Motorista <ArrowUpDown className="w-3 h-3 ml-1.5 opacity-50"/>
            </button>
          </div>
        )}

        {activeTab === 'todas' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-slate-50/50 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center mr-2">
               Filtrar:
            </span>
            <select value={filterMotorista} onChange={e => setFilterMotorista(e.target.value)} className="text-sm font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
              <option value="">Todos os Motoristas</option>
              {uniqueMotoristas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)} className="text-sm font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
              <option value="">Todos os Meses</option>
              {uniqueMeses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Lista Rendereziada */}
        {activeTab !== 'importar' && displayedTrips.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4"><CheckCircle className="h-10 w-10 text-slate-300" /></div>
            <p className="text-slate-500 text-lg font-medium">Nenhum registo pendente nesta vista.</p>
          </div>
        ) : activeTab !== 'importar' && (
          <ul className="divide-y divide-slate-100">
            {displayedTrips.map(item => {
              const isPendente = item.status === 'Em Análise';
              const nomeExibicao = item.nome || item.motorista; 

              return (
                <li key={item.id} className="p-6 sm:p-8 hover:bg-blue-50/10 transition-colors group">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {nomeExibicao.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-black text-slate-900 text-lg block leading-none">{nomeExibicao}</span>
                          <span className="text-xs font-semibold text-slate-400">{item.email}</span>
                        </div>
                        <div className="ml-auto lg:ml-4"><StatusBadge status={item.status} /></div>
                      </div>

                      {item.mensagem && isPendente && (
                        <div className="bg-blue-50/50 text-blue-800 p-4 rounded-2xl text-sm mb-5 border border-blue-100">
                          <span className="font-bold flex items-center mb-1 text-[11px] uppercase tracking-wider text-blue-500"><MessageSquare className="w-3 h-3 mr-1"/> Mensagem Recebida</span>
                          <span className="font-medium">{item.mensagem}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Data / Mês</span>
                          <span className="font-bold text-slate-800">{new Date(item.data).toLocaleDateString('pt-BR')} <span className="text-slate-400 ml-1">({item.mes || '-'})</span></span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Rota</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {item.origem.split(',')[0]} <span className="text-slate-300 mx-1">➔</span> {item.destino.split(',')[0]}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Contentor</span>
                          <span className="font-bold text-slate-800">{item.container || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Tipo</span>
                          <span className="font-bold text-slate-800">{item.tipo || '-'}</span>
                        </div>
                      </div>

                      {item.comprovante_url && (
                        <div className="mt-5">
                          <button 
                            onClick={() => setViewImageUrl(item.comprovante_url)}
                            className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 hover:text-blue-700 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                          >
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                            <span>Ver Comprovante</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isPendente && (
                      <div className="flex flex-col justify-start gap-3 lg:w-[280px] shrink-0">
                        {actionState.id === item.id ? (
                          <div className="w-full flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                            <textarea 
                              className={`w-full text-sm p-3 border rounded-xl focus:ring-4 outline-none transition-all resize-none ${
                                actionState.type === 'approve' 
                                  ? 'border-blue-200 focus:ring-blue-500/10 focus:border-blue-400 bg-white' 
                                  : 'border-rose-200 focus:ring-rose-500/10 focus:border-rose-400 bg-white'
                              }`}
                              placeholder={actionState.type === 'approve' ? "Nota (Opcional)..." : "Motivo da recusa..."}
                              value={actionMessage}
                              onChange={(e) => setActionMessage(e.target.value)}
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => confirmAction(item)}
                                className={`flex-1 text-white text-sm py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md ${
                                  actionState.type === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-500 hover:bg-rose-600'
                                }`}
                              >
                                Confirmar
                              </button>
                              <button 
                                onClick={() => { setActionState({ id: null, type: null }); setActionMessage(''); }}
                                className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-sm py-2.5 rounded-xl font-bold transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => { setActionState({ id: item.id, type: 'approve' }); setActionMessage(''); }}
                              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm hover:shadow-md"
                            >
                              <CheckCircle className="h-4 w-4 opacity-70" />
                              <span>Aprovar Viagem</span>
                            </button>
                            <button 
                              onClick={() => { setActionState({ id: item.id, type: 'reject' }); setActionMessage(''); }}
                              className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-5 py-3 rounded-xl font-bold transition-colors"
                            >
                              <XCircle className="h-4 w-4 opacity-70" />
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {item.resposta && !isPendente && (
                      <div className={`lg:w-1/3 p-5 rounded-2xl border flex items-start space-x-3 h-fit shadow-sm ${
                        item.status === 'Reprovado' ? 'bg-rose-50 border-rose-100' : 'bg-teal-50 border-teal-100'
                      }`}>
                        <AlertCircle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${item.status === 'Reprovado' ? 'text-rose-500' : 'text-teal-500'}`} />
                        <div>
                          <span className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${item.status === 'Reprovado' ? 'text-rose-700' : 'text-teal-700'}`}>
                            {item.status === 'Reprovado' ? 'Motivo da Recusa' : 'Nota da Fidelidade'}
                          </span>
                          <p className={`text-sm font-medium leading-relaxed ${item.status === 'Reprovado' ? 'text-rose-800' : 'text-teal-800'}`}>{item.resposta}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Visor de Imagens Moderno */}
      {viewImageUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setViewImageUrl(null)}>
          <div className="relative max-w-5xl w-full flex flex-col items-center justify-center h-full animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewImageUrl(null)} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-slate-800 bg-white hover:bg-slate-100 transition-colors flex items-center space-x-2 px-4 py-2.5 rounded-full shadow-xl font-bold z-10">
              <XCircle className="w-5 h-5" /> <span className="hidden sm:inline">Fechar</span>
            </button>
            <img src={viewImageUrl} alt="Comprovante" className="max-h-[85vh] w-auto rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] object-contain ring-4 ring-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE AUXILIAR: MODAL DE ADIÇÃO
// ============================================================================
function AddTripModal({ currentUser, onClose, onSave, supabase }) {
  const [formData, setFormData] = useState({
    data: '', origem: '', destino: '', container: '', tipo: 'Importação', mensagem: ''
  });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    let comprovanteUrlFinal = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('comprovantes').upload(fileName, file);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
        comprovanteUrlFinal = publicUrlData.publicUrl;
      }
      await onSave({ ...formData, comprovante_url: comprovanteUrlFinal });
    } catch (error) {
      alert("Falha ao anexar ficheiro. Tente sem ficheiro.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Registar Viagem</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Preencha os dados da viagem em falta.</p>
          </div>
          <button onClick={onClose} disabled={isUploading} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-8 bg-slate-50/50">
          <form id="add-trip-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Data da Viagem</label>
              <input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})}
                className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border outline-none transition-all" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Origem</label>
                <input type="text" required placeholder="Ex: Santos, SP" value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})}
                  className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Destino</label>
                <input type="text" required placeholder="Ex: Campinas, SP" value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})}
                  className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contentor</label>
                <input type="text" placeholder="Ex: MSKU1234567" value={formData.container} onChange={e => setFormData({...formData, container: e.target.value.toUpperCase()})}
                  className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border uppercase outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo Operação</label>
                <select required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}
                  className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border outline-none transition-all bg-white">
                  <option value="Importação">Importação</option>
                  <option value="Exportação">Exportação</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Vazio">Vazio</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Comprovativo</label>
              <div className="relative">
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className={`flex items-center justify-center space-x-3 w-full border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${file ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-400'}`}>
                  {file ? <CheckCircle className="w-6 h-6 text-blue-500" /> : <Upload className="w-6 h-6" />}
                  <span className="font-bold text-sm truncate">{file ? file.name : 'Clique para anexar foto (Opcional)'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem</label>
              <textarea placeholder="Motivo do não registo automático..." rows="2" value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})}
                className="w-full border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 p-3.5 border outline-none transition-all resize-none"></textarea>
            </div>
          </form>
        </div>

        <div className="flex p-6 border-t border-slate-100 bg-white gap-3">
          <button type="button" onClick={onClose} disabled={isUploading} className="flex-1 py-3.5 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="add-trip-form" disabled={isUploading} className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Enviar Solicitação</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE AUXILIAR: BADGE DE STATUS
// ============================================================================
function StatusBadge({ status }) {
  const styles = {
    confirmada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Aprovada: 'bg-teal-100 text-teal-700 border-teal-200',
    Aprovado: 'bg-teal-100 text-teal-700 border-teal-200',
    Pendente: 'bg-amber-100 text-amber-700 border-amber-200',
    'Em Análise': 'bg-blue-100 text-blue-700 border-blue-200',
    Reprovado: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const icons = {
    confirmada: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />,
    Aprovada: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />,
    Aprovado: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />,
    Pendente: <Clock className="w-3.5 h-3.5 mr-1.5" />,
    'Em Análise': <Clock className="w-3.5 h-3.5 mr-1.5" />,
    Reprovado: <XCircle className="w-3.5 h-3.5 mr-1.5" />
  };

  const labels = {
    confirmada: 'Confirmada',
    Aprovada: 'Aprovada (RH)',
    Aprovado: 'Aprovada (RH)',
    Pendente: 'À Conferir',
    'Em Análise': 'Em Análise',
    Reprovado: 'Reprovada'
  };

  const normalizedStatus = status === 'inclusa' ? 'Em Análise' : status;

  return (
    <span className={`flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wide border shadow-sm ${styles[normalizedStatus] || styles.Pendente}`}>
      {icons[normalizedStatus] || icons.Pendente}
      {labels[normalizedStatus] || normalizedStatus}
    </span>
  );
}

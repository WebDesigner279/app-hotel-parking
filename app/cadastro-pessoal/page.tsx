"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaEnvelope, FaUser } from "react-icons/fa";
import styles from "./CadastroPessoal.module.scss";

interface PessoaData {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  profissao: string;
  fotoUrl: string;
  tipoImovel: string;
  numeroImovel: string;
  tipoContrato: string;
  dataEntrada: string;
}

const initialFormData: PessoaData = {
  id: "",
  nome: "",
  documento: "",
  telefone: "",
  profissao: "",
  fotoUrl: "",
  tipoImovel: "nenhum",
  numeroImovel: "",
  tipoContrato: "mensalista",
  dataEntrada: "",
};

export default function CadastroPessoal() {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [form, setForm] = useState<PessoaData>(initialFormData);
  const [pessoas, setPessoas] = useState<PessoaData[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [mostrandoCamera, setMostrandoCamera] = useState(false);
  const [streamCamera, setStreamCamera] = useState<MediaStream | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<PessoaData[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    if (typeof window !== 'undefined') {
      const dadosSalvos = localStorage.getItem('pessoas-cadastradas');
      if (dadosSalvos) {
        const pessoasCarregadas = JSON.parse(dadosSalvos);
        setPessoas(pessoasCarregadas);
        setResultadosBusca(pessoasCarregadas);
      }
    }
  };

  const salvarDados = (novosDados: PessoaData[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pessoas-cadastradas', JSON.stringify(novosDados));
      setPessoas(novosDados);
      setResultadosBusca(novosDados);
    }
  };

  const toggleSidebar = () => {
    setSidebarAberta(!sidebarAberta);
  };

  const fecharSidebar = () => {
    setSidebarAberta(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Capitalizar primeira letra para campos de texto específicos
    if (name === 'nome' || name === 'profissao' || name === 'blocoLocal') {
      const valorCapitalizado = value.charAt(0).toUpperCase() + value.slice(1);
      setForm(prev => ({ ...prev, [name]: valorCapitalizado }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const agora = new Date();
    const formParaSalvar = {
      ...form,
      dataEntrada: form.dataEntrada || agora.toISOString().split('T')[0]
    };

    if (editandoId) {
      const atualizados = pessoas.map((p) =>
        p.id === editandoId ? { ...formParaSalvar, id: editandoId } : p
      );
      salvarDados(atualizados);
      alert("Dados atualizados!");
    } else {
      const novo = { ...formParaSalvar, id: crypto.randomUUID() };
      salvarDados([...pessoas, novo]);
      alert("Pessoa cadastrada!");
    }

    setForm(initialFormData);
    setEditandoId(null);
    setPreviewFoto(null);
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const handleEditar = (id: string) => {
    const pessoa = pessoas.find(p => p.id === id);
    if (pessoa) {
      setForm(pessoa);
      setEditandoId(id);
      setPreviewFoto(pessoa.fotoUrl || null);
    }
  };

  const handleExcluir = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta pessoa?")) {
      const atualizados = pessoas.filter(p => p.id !== id);
      salvarDados(atualizados);
      
      if (editandoId === id) {
        setForm(initialFormData);
        setEditandoId(null);
        setPreviewFoto(null);
      }
      
      alert("Pessoa excluída!");
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setForm(initialFormData);
    setPreviewFoto(null);
    
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fotoDataUrl = event.target?.result as string;
        setForm(prev => ({ ...prev, fotoUrl: fotoDataUrl }));
        setPreviewFoto(fotoDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const abrirCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStreamCamera(stream);
      setMostrandoCamera(true);
      
      setTimeout(() => {
        const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const fecharCamera = () => {
    if (streamCamera) {
      streamCamera.getTracks().forEach(track => track.stop());
      setStreamCamera(null);
    }
    setMostrandoCamera(false);
  };

  const tirarFoto = () => {
    const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvasElement = document.createElement('canvas');
    const context = canvasElement.getContext('2d');

    if (videoElement && context) {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0);
      const fotoDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);
      setForm((prev) => ({ ...prev, fotoUrl: fotoDataUrl }));
      setPreviewFoto(fotoDataUrl);
      fecharCamera();
    }
  };

  const realizarBusca = (termo: string) => {
    if (!termo.trim()) {
      setResultadosBusca(pessoas);
      return;
    }

    const termoNormalizado = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const resultados = pessoas.filter(pessoa => {
      const nome = pessoa.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const documento = pessoa.documento.toLowerCase();
      const telefone = pessoa.telefone.toLowerCase();
      const profissao = pessoa.profissao.toLowerCase();
      
      return nome.includes(termoNormalizado) ||
             documento.includes(termoNormalizado) ||
             telefone.includes(termoNormalizado) ||
             profissao.includes(termoNormalizado);
    });

    setResultadosBusca(resultados);
  };

  const limparBusca = () => {
    setTermoBusca("");
    setResultadosBusca(pessoas);
    
    // Se estiver editando devido a uma busca, limpar o formulário também
    if (editandoId) {
      setEditandoId(null);
      setForm(initialFormData);
      setPreviewFoto(null);
      
      // Limpar o input de arquivo
      const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
      if (inputFile) {
        inputFile.value = '';
      }
    }

    // Garantir que o sidebar permaneça aberto após limpar a busca
    // Especialmente útil em dispositivos mobile onde o sidebar pode ter sido fechado durante a busca
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && !sidebarAberta) {
      setSidebarAberta(true);
    }
  };

  const excluirTodosDados = () => {
    if (typeof window === 'undefined') return;
    
    const confirmacao = prompt(
      "⚠️ ATENÇÃO: Esta ação irá excluir TODOS os dados cadastrados.\n\n" +
      "Para confirmar, digite: EXCLUIR TUDO"
    );
    
    if (confirmacao === "EXCLUIR TUDO") {
      localStorage.removeItem('pessoas-cadastradas');
      setPessoas([]);
      setResultadosBusca([]);
      setForm(initialFormData);
      setEditandoId(null);
      setPreviewFoto(null);
      alert("✅ Todos os dados foram excluídos!");
    } else if (confirmacao !== null) {
      alert("❌ Operação cancelada. Texto de confirmação incorreto.");
    }
  };

  return (
    <div className={styles.appLayout}>
      {/* Toggle button para mobile */}
      <button 
        className={styles.sidebarToggle} 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {sidebarAberta ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay para mobile */}
      <div 
        className={`${styles.sidebarOverlay} ${sidebarAberta ? styles.active : ''}`}
        onClick={fecharSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarAberta ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Hotel Parking</h2>
        </div>

        {/* Seção de navegação */}
        <div className={styles.navigationSection}>
          <h3 className={styles.sectionTitle}>Navegação</h3>
          <nav className={styles.navList}>
            <Link 
              href="/home" 
              className={`${styles.navLink} ${pathname === "/home" ? styles.activeNav : ""}`}
              onClick={fecharSidebar}
            >
              <FaHome className={styles.navIcon} />
              <span>Sistema Principal</span>
            </Link>
            <Link 
              href="/cadastro-pessoal" 
              className={`${styles.navLink} ${pathname === "/cadastro-pessoal" ? styles.activeNav : ""}`}
              onClick={fecharSidebar}
            >
              <FaUser className={styles.navIcon} />
              <span>Cadastro Pessoal</span>
            </Link>
            <Link 
              href="/sobre" 
              className={`${styles.navLink} ${pathname === "/sobre" ? styles.activeNav : ""}`}
              onClick={fecharSidebar}
            >
              <FaInfoCircle className={styles.navIcon} />
              <span>Sobre</span>
            </Link>
            <Link 
              href="/contato" 
              className={`${styles.navLink} ${pathname === "/contato" ? styles.activeNav : ""}`}
              onClick={fecharSidebar}
            >
              <FaEnvelope className={styles.navIcon} />
              <span>Contato</span>
            </Link>
          </nav>
        </div>

        {/* Seção de busca */}
        <div className={styles.searchSection}>
          <h3 className={styles.sectionTitle}>Buscar Pessoa</h3>
          <div className={styles.buscaWrapper}>
            <input
              type="text"
              placeholder="Nome, documento, telefone..."
              value={termoBusca}
              onChange={(e) => {
                setTermoBusca(e.target.value);
                realizarBusca(e.target.value);
              }}
              className={styles.searchInput}
            />
          </div>
          {termoBusca && (
            <div className={styles.searchButtons}>
              <button
                className={styles.limparBtn}
                onClick={limparBusca}
                title="Limpar busca"
              >
                Limpar Busca
              </button>
            </div>
          )}
        </div>

        {/* Seção de estatísticas */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Estatísticas</h3>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total de Pessoas</span>
              <span className={styles.statNumber}>{pessoas.length}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔍</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Resultados da Busca</span>
              <span className={styles.statNumber}>{resultadosBusca.length}</span>
            </div>
          </div>
        </div>

        {/* Seção de ações */}
        <div className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Ações</h3>
          <button onClick={excluirTodosDados} className={styles.actionButtonDanger} title="Excluir todos os dados">
            🗑️ Excluir Todos
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>Cadastro de Pessoas</h1>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Seção de foto */}
            <div className={styles.fotoNomeGrupo}>
              <div className={styles.fotoPreview}>
                {previewFoto ? (
                  <img src={previewFoto} alt="Preview" className={styles.previewImage} />
                ) : (
                  <div className={styles.placeholderFoto}>
                    <span>📷</span>
                    <p>Foto da Pessoa</p>
                  </div>
                )}
                
                <div className={styles.fotoButtons}>
                  <button type="button" onClick={abrirCamera} className={styles.cameraButton}>
                    Tirar Foto
                  </button>
                  <label htmlFor="foto-input-galeria" className={styles.galeriaButton}>
                    Galeria
                    <input
                      id="foto-input-galeria"
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Dados pessoais */}
              <div className={styles.dadosPessoais}>
                <div className={styles.formRow}>
                  <label>
                    Nome Completo:
                    <input
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    RG/CPF:
                    <input
                      type="text"
                      name="documento"
                      value={form.documento}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>

                <div className={styles.formRow}>
                  <label>
                    Telefone/Celular:
                    <input
                      type="tel"
                      name="telefone"
                      value={form.telefone}
                      onChange={handleChange}
                      placeholder="(99) 9 9999-9999"
                    />
                  </label>

                  <label>
                    Profissão:
                    <input
                      type="text"
                      name="profissao"
                      value={form.profissao}
                      onChange={handleChange}
                      placeholder="Ex: Lojista, Contador, etc."
                    />
                  </label>
                </div>

                <div className={styles.formRow}>
                  <label>
                    Tipo de Imóvel:
                    <select
                      name="tipoImovel"
                      value={form.tipoImovel}
                      onChange={handleChange}
                    >
                      <option value="nenhum">Nenhum</option>
                      <option value="casa">Casa</option>
                      <option value="apartamento">Apartamento</option>
                      <option value="quarto">Quarto</option>
                      <option value="pousada">Pousada</option>
                    </select>
                  </label>

                  <label>
                    Número do Imóvel:
                    <select
                      name="numeroImovel"
                      value={form.numeroImovel}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {Array.from({ length: 50 }, (_, i) => (
                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                          {(i + 1).toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className={styles.formRow}>
                  <label>
                    Tipo de Contrato:
                    <select
                      name="tipoContrato"
                      value={form.tipoContrato}
                      onChange={handleChange}
                    >
                      <option value="mensalista">Mensalista</option>
                      <option value="por_hora">Por Hora</option>
                      <option value="diaria">Diária</option>
                      <option value="pernoite">Pernoite</option>
                    </select>
                  </label>

                  <label>
                    Data de Entrada:
                    <input
                      type="date"
                      name="dataEntrada"
                      value={form.dataEntrada}
                      onChange={handleChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitButton}>
                {editandoId ? "Atualizar Dados" : "Cadastrar Pessoa"}
              </button>
              
              {editandoId && (
                <button 
                  type="button" 
                  onClick={handleCancelarEdicao} 
                  className={styles.cancelButton}
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>

          {/* Modal da câmera */}
          {mostrandoCamera && (
            <div className={styles.cameraModal}>
              <div className={styles.cameraContent}>
                <video
                  id="camera-preview"
                  autoPlay
                  playsInline
                  className={styles.cameraVideo}
                />
                <div className={styles.cameraButtons}>
                  <button onClick={tirarFoto} className={styles.captureButton}>
                    Capturar
                  </button>
                  <button onClick={fecharCamera} className={styles.closeButton}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de resultados */}
          {resultadosBusca.length > 0 && (
            <div className={styles.scrollWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nome</th>
                    <th>Documento</th>
                    <th>Telefone</th>
                    <th>Profissão</th>
                    <th>Imóvel</th>
                    <th>Tipo Contrato</th>
                    <th>Data Entrada</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosBusca.map((pessoa) => (
                    <tr key={pessoa.id}>
                      <td className={styles.fotoCell}>
                        {pessoa.fotoUrl ? (
                          <img src={pessoa.fotoUrl} alt="Foto" className={styles.fotoTabela} />
                        ) : (
                          <div className={styles.semFoto}>👤</div>
                        )}
                      </td>
                      <td>{pessoa.nome}</td>
                      <td>{pessoa.documento}</td>
                      <td>{pessoa.telefone}</td>
                      <td>{pessoa.profissao}</td>
                      <td>
                        {pessoa.tipoImovel !== 'nenhum' && (
                          <span>
                            {pessoa.tipoImovel} {pessoa.numeroImovel}
                          </span>
                        )}
                      </td>
                      <td>{pessoa.tipoContrato}</td>
                      <td>{pessoa.dataEntrada}</td>
                      <td className={styles.acoesCell}>
                        <button 
                          onClick={() => handleEditar(pessoa.id)} 
                          title="Editar Pessoa"
                          className={styles.editButton}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleExcluir(pessoa.id)} 
                          title="Excluir Pessoa"
                          className={styles.deleteButton}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

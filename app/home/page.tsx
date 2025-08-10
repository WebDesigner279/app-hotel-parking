"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaEnvelope, FaUser } from "react-icons/fa";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from "./Home.module.scss";

type VehicleType = "carro" | "moto" | "caminhao";

interface VehicleData {
  id: string;
  tipo: VehicleType;
  placa: string;
  modelo: string;
  ano: string;
  cor: string;
  condutor: string;
  documento: string;
  telefone: string;
  profissao: string;
  tipoContrato: string;
  localEstacionamento: string;
  dataEntrada: string;
  horaEntrada: string;
  duracaoMinutos: number;
  fotoUrl: string;
  fotoDocumentoVeiculoUrl?: string;
  fotoCnhUrl?: string;
  fotoComprovanteEnderecoUrl?: string;
}

export default function VehicleFormPage() {
  const pathname = usePathname();
  const [form, setForm] = useState<VehicleData>({
    id: "",
    tipo: "carro",
    placa: "",
    modelo: "",
    ano: "",
    cor: "",
    condutor: "",
    documento: "",
    telefone: "",
    profissao: "",
    tipoContrato: "mensalista",
    localEstacionamento: "",
    dataEntrada: "",
    horaEntrada: "",
    duracaoMinutos: 60,
    fotoUrl: "",
    fotoDocumentoVeiculoUrl: "",
    fotoCnhUrl: "",
    fotoComprovanteEnderecoUrl: "",
  });

  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [previewFotoDocumentoVeiculo, setPreviewFotoDocumentoVeiculo] = useState<string | null>(null);
  const [previewFotoCnh, setPreviewFotoCnh] = useState<string | null>(null);
  const [previewFotoComprovanteEndereco, setPreviewFotoComprovanteEndereco] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<VehicleData[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editacaoManual, setEdicaoManual] = useState(false); // Distingue edição manual da busca automática
  const [tempoAtual, setTempoAtual] = useState(new Date());
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [streamCamera, setStreamCamera] = useState<MediaStream | null>(null);
  const [mostrandoCamera, setMostrandoCamera] = useState<false | 'pessoa' | 'documentoVeiculo'>(false);

  useEffect(() => {
    carregarDados();
    
    // Atualizar o tempo a cada minuto para recalcular os tempos decorridos
    const interval = setInterval(() => {
      setTempoAtual(new Date());
    }, 60000); // 60 segundos
    
    return () => {
      clearInterval(interval);
      // Limpar stream da câmera se estiver ativo
      if (streamCamera) {
        streamCamera.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // UseEffect para ajustar duração automaticamente baseado no tipo de contrato
  useEffect(() => {
    // Sugerir duração padrão baseada no tipo de contrato
    let duracaoSugerida = form.duracaoMinutos;
    
    switch (form.tipoContrato) {
      case "mensalista":
        duracaoSugerida = 43200; // 30 dias
        break;
      case "por_hora":
        duracaoSugerida = 60; // 1 hora
        break;
    }
    
    // Atualizar apenas se a duração atual não faz sentido para o tipo de contrato
    if (
      (form.tipoContrato === "mensalista" && form.duracaoMinutos < 1440) ||
      (form.tipoContrato === "por_hora" && form.duracaoMinutos > 720)
    ) {
      setForm(prev => ({
        ...prev,
        duracaoMinutos: duracaoSugerida
      }));
    }
  }, [form.tipoContrato]);

  // UseEffect para fechar sidebar automaticamente ao rolar (exceto dentro do sidebar)
  useEffect(() => {
    const handlePageScroll = () => {
      // Apenas fechar sidebar no scroll da página em mobile se estiver aberto
      if (sidebarAberta && window.innerWidth <= 768) {
        setSidebarAberta(false);
      }
    };

    const handleMainContentScroll = () => {
      if (sidebarAberta && window.innerWidth <= 768) {
        setSidebarAberta(false);
      }
    };

    // Adicionar listener para rolagem da página principal
    window.addEventListener('scroll', handlePageScroll, { passive: true });
    
    // Adicionar listener para rolagem dentro do conteúdo principal
    const mainContentElement = document.querySelector(`.${styles.mainContent}`);
    if (mainContentElement) {
      mainContentElement.addEventListener('scroll', handleMainContentScroll, { passive: true });
    }

    // Adicionar listener para rolagem dentro do container da tabela
    const scrollWrapperElement = document.querySelector(`.${styles.scrollWrapper}`);
    if (scrollWrapperElement) {
      scrollWrapperElement.addEventListener('scroll', handleMainContentScroll, { passive: true });
    }

    // Adicionar listener para cliques fora do sidebar (apenas em mobile)
    const handleOutsideClick = (event: MouseEvent) => {
      if (sidebarAberta && window.innerWidth <= 768) {
        const sidebarElement = document.querySelector(`.${styles.sidebar}`);
        const toggleElement = document.querySelector(`.${styles.sidebarToggle}`);
        const limparBtnElement = document.querySelector(`.${styles.limparBtn}`);
        
        // Verificar se o clique foi dentro do sidebar, no toggle ou no botão limpar busca
        if (sidebarElement && toggleElement && 
            !sidebarElement.contains(event.target as Node) && 
            !toggleElement.contains(event.target as Node) &&
            !(limparBtnElement && limparBtnElement.contains(event.target as Node))) {
          setSidebarAberta(false);
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
      document.removeEventListener('click', handleOutsideClick);
      if (mainContentElement) {
        mainContentElement.removeEventListener('scroll', handleMainContentScroll);
      }
      if (scrollWrapperElement) {
        scrollWrapperElement.removeEventListener('scroll', handleMainContentScroll);
      }
    };
  }, [sidebarAberta, styles.mainContent, styles.scrollWrapper, styles.sidebar, styles.sidebarToggle]);

  const carregarDados = () => {
    if (typeof window !== 'undefined') {
      const data = JSON.parse(localStorage.getItem("veiculos") || "[]");
      setResultados(data);
    }
  };

  // Funções para controlar o sidebar mobile
  const toggleSidebar = () => {
    setSidebarAberta(!sidebarAberta);
  };

  const fecharSidebar = () => {
    setSidebarAberta(false);
  };

  // Fechar sidebar ao clicar no overlay
  const handleOverlayClick = () => {
    fecharSidebar();
  };

  // Função para capitalizar texto (primeira letra de cada palavra maiúscula)
  const capitalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Aplicar capitalização automática para campos específicos
    let valorFormatado = value;
    if (name === 'condutor' || name === 'cor' || name === 'modelo' || name === 'profissao') {
      valorFormatado = capitalizarTexto(value);
    }
    
    // Sincronizar duração com tipo de contrato
    if (name === 'tipoContrato') {
      let duracaoSincronizada = form.duracaoMinutos;
      
      if (value === 'por_hora') {
        // Para "Por Hora", ajustar para durações em horas (máximo 12 horas)
        if (form.duracaoMinutos > 720) { // Se for maior que 12 horas
          duracaoSincronizada = 60; // Resetar para 1 hora (recomendado)
        }
      } else if (value === 'mensalista') {
        // Para "Mensalista", ajustar para durações em dias
        if (form.duracaoMinutos < 1440) { // Se for menor que 24 horas
          duracaoSincronizada = 43200; // Resetar para 30 dias (recomendado)
        }
      }
      
      setForm((prev) => ({ 
        ...prev, 
        [name]: valorFormatado,
        duracaoMinutos: duracaoSincronizada
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: valorFormatado }));
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
      setMostrandoCamera('pessoa');
      
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

  // Função para fechar câmera
  const fecharCamera = () => {
    if (streamCamera) {
      streamCamera.getTracks().forEach(track => track.stop());
      setStreamCamera(null);
    }
    setMostrandoCamera(false);
  };

  // Função utilitária para verificar se é PDF
  const isPDF = (file: File) => {
    return file.type === 'application/pdf';
  };

  // Função para verificar se uma URL é PDF
  const isPDFUrl = (url: string) => {
    return url && (url.startsWith('blob:') || url.includes('.pdf') || url.startsWith('data:application/pdf'));
  };

  // Funções para foto do documento do veículo
  const handleFotoDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPDF(file)) {
        // Para PDFs, salvar como URL de objeto
        const pdfUrl = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, fotoDocumentoVeiculoUrl: pdfUrl }));
        setPreviewFotoDocumentoVeiculo(pdfUrl);
      } else {
        // Para imagens, converter para base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const fotoDataUrl = event.target?.result as string;
          setForm(prev => ({ ...prev, fotoDocumentoVeiculoUrl: fotoDataUrl }));
          setPreviewFotoDocumentoVeiculo(fotoDataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Função para ampliar foto do documento
  const ampliarFotoDocumento = () => {
    if (previewFotoDocumentoVeiculo) {
      setFotoAmpliada(previewFotoDocumentoVeiculo);
    }
  };

  // Funções para foto da CNH
  const handleFotoCnhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPDF(file)) {
        // Para PDFs, salvar como URL de objeto
        const pdfUrl = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, fotoCnhUrl: pdfUrl }));
        setPreviewFotoCnh(pdfUrl);
      } else {
        // Para imagens, converter para base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const fotoDataUrl = event.target?.result as string;
          setForm(prev => ({ ...prev, fotoCnhUrl: fotoDataUrl }));
          setPreviewFotoCnh(fotoDataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Função para ampliar foto da CNH
  const ampliarFotoCnh = () => {
    if (previewFotoCnh) {
      setFotoAmpliada(previewFotoCnh);
    }
  };

  // Funções para foto do comprovante de endereço
  const handleFotoComprovanteEnderecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPDF(file)) {
        // Para PDFs, salvar como URL de objeto
        const pdfUrl = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, fotoComprovanteEnderecoUrl: pdfUrl }));
        setPreviewFotoComprovanteEndereco(pdfUrl);
      } else {
        // Para imagens, converter para base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const fotoDataUrl = event.target?.result as string;
          setForm(prev => ({ ...prev, fotoComprovanteEnderecoUrl: fotoDataUrl }));
          setPreviewFotoComprovanteEndereco(fotoDataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Função para ampliar foto do comprovante de endereço
  const ampliarFotoComprovanteEndereco = () => {
    if (previewFotoComprovanteEndereco) {
      setFotoAmpliada(previewFotoComprovanteEndereco);
    }
  };

  // Função para fechar foto ampliada
  const fecharFotoAmpliada = () => {
    setFotoAmpliada(null);
  };

  const salvarDados = (dados: VehicleData[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("veiculos", JSON.stringify(dados));
      setResultados(dados);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar placa antes de salvar
    if (!validarPlaca(form.placa)) {
      alert('⚠️ Placa inválida!\n\nFormatos aceitos:\n• Padrão antigo: ABC-1234\n• Padrão Mercosul: ABC1D23');
      return;
    }

    // Se não há data/hora de entrada, usar o momento atual
    const agora = new Date();
    const formParaSalvar = {
      ...form,
      dataEntrada: form.dataEntrada || agora.toISOString().split('T')[0]
    };

    if (editandoId) {
      const atualizados = resultados.map((v) =>
        v.id === editandoId ? { ...formParaSalvar, id: editandoId } : v
      );
      salvarDados(atualizados);
      alert("Dados atualizados!");
    } else {
      const novo = { ...formParaSalvar, id: crypto.randomUUID() };
      salvarDados([...resultados, novo]);
      alert("Veículo cadastrado!");
    }

    setForm({
      id: "",
      tipo: "carro",
      placa: "",
      modelo: "",
      ano: "",
      cor: "",
      condutor: "",
      documento: "",
      telefone: "",
      profissao: "",
      tipoContrato: "mensalista",
      localEstacionamento: "",
      dataEntrada: "",
      horaEntrada: "",
      duracaoMinutos: 60,
      fotoUrl: "",
      fotoDocumentoVeiculoUrl: "",
      fotoCnhUrl: "",
      fotoComprovanteEnderecoUrl: "",
    });
    setEditandoId(null);
    setEdicaoManual(false);
    setPreviewFoto(null);
    setPreviewFotoDocumentoVeiculo(null);
    setPreviewFotoCnh(null);
    setPreviewFotoComprovanteEndereco(null);
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const realizarBusca = (termo: string, fecharSidebar: boolean = false, carregarNoFormulario: boolean = false) => {
    // Verificar se é mobile e se o termo está vazio quando acionado pelo botão
    if (fecharSidebar && !termo.trim() && typeof window !== 'undefined' && window.innerWidth <= 768) {
      alert("📝 Digite seu critério de busca\n\nVocê pode buscar por:\n• Nome do condutor\n• Placa do veículo\n• Modelo do veículo\n• Cor\n• Documento\n• E-mail\n• Profissão");
      return;
    }
    
    const termoNormalizado = normalizarTexto(termo);
    
    // Carregar todos os dados do localStorage para buscar
    if (typeof window !== 'undefined') {
      const todosOsDados = JSON.parse(localStorage.getItem("veiculos") || "[]");
    
      if (!termoNormalizado) {
        // Se não há termo de busca, mostrar todos os dados
        setResultados(todosOsDados);
        // Apenas limpar o formulário se estava editando
        if (editandoId) {
          setEditandoId(null);
          setEdicaoManual(false);
          setForm({
            id: "",
            tipo: "carro",
            placa: "",
            modelo: "",
            ano: "",
            cor: "",
            condutor: "",
            documento: "",
            telefone: "",
            profissao: "",
            tipoContrato: "mensalista",
            localEstacionamento: "",
            dataEntrada: "",
            horaEntrada: "",
            duracaoMinutos: 60,
            fotoUrl: "",
          });
          setPreviewFoto(null);
        }
        return;
      }
    
      const filtrado = todosOsDados.filter(
        (item: VehicleData) =>
          normalizarTexto(item.condutor).includes(termoNormalizado) ||
          normalizarTexto(item.placa.replace('-', '')).includes(termoNormalizado.replace('-', '')) ||
          normalizarTexto(item.modelo).includes(termoNormalizado) ||
          normalizarTexto(item.cor).includes(termoNormalizado) ||
          normalizarTexto(item.documento).includes(termoNormalizado) ||
          normalizarTexto(item.telefone).includes(termoNormalizado) ||
          normalizarTexto(item.profissao).includes(termoNormalizado) ||
          normalizarTexto(item.ano).includes(termoNormalizado)
      );
    
      // Sempre atualizar a tabela com os resultados filtrados
      setResultados(filtrado);
    
      // Se deve carregar no formulário (botão de busca ou carregamento automático no desktop)
      if (carregarNoFormulario) {
        if (filtrado.length > 0) {
          const primeiroResultado = filtrado[0];
          setForm(primeiroResultado);
          setPreviewFoto(primeiroResultado.fotoUrl);
          setEditandoId(primeiroResultado.id);
          // Se foi chamado pelo botão de busca (fecharSidebar=true), é edição manual
          setEdicaoManual(fecharSidebar);
        } else {
          // Se não encontrou resultados, mostrar alerta apenas quando acionado pelo botão
          if (fecharSidebar) {
            alert(`🔍 Nenhum resultado encontrado para: "${termo}"\n\nTente buscar por:\n• Nome do condutor\n• Placa do veículo\n• Modelo do veículo\n• Cor\n• Documento\n• Telefone\n• E-mail\n• Profissão\n• Ano`);
          }
          // Limpar formulário se não há resultados e estava carregando automaticamente
          if (!fecharSidebar && editandoId) {
            setEditandoId(null);
            setEdicaoManual(false);
            setForm({
              id: "",
              tipo: "carro",
              placa: "",
              modelo: "",
              ano: "",
              cor: "",
              condutor: "",
              documento: "",
              telefone: "",
              profissao: "",
              tipoContrato: "mensalista",
              localEstacionamento: "",
              dataEntrada: "",
              horaEntrada: "",
              duracaoMinutos: 60,
              fotoUrl: "",
              fotoDocumentoVeiculoUrl: "",
              fotoCnhUrl: "",
              fotoComprovanteEnderecoUrl: "",
            });
            setPreviewFoto(null);
            setPreviewFotoDocumentoVeiculo(null);
            setPreviewFotoCnh(null);
            setPreviewFotoComprovanteEndereco(null);
          }
        }
      }
    
      // Fechar sidebar apenas quando acionado pelo botão de busca (não em tempo real)
      if (fecharSidebar && window.innerWidth <= 768) {
        setSidebarAberta(false);
      }
    }
  };

  const limparBusca = () => {
    setBusca("");
    carregarDados();
    
    // Se estiver editando devido a uma busca, limpar o formulário também (mas sem recursão)
    if (editandoId) {
      setEditandoId(null);
      setEdicaoManual(false);
      setForm({
        id: "",
        tipo: "carro",
        placa: "",
        modelo: "",
        ano: "",
        cor: "",
        condutor: "",
        documento: "",
        telefone: "",
        profissao: "",
        tipoContrato: "mensalista",
        localEstacionamento: "",
        dataEntrada: "",
        horaEntrada: "",
        duracaoMinutos: 60,
        fotoUrl: "",
        fotoDocumentoVeiculoUrl: "",
        fotoCnhUrl: "",
        fotoComprovanteEnderecoUrl: "",
      });
      setPreviewFoto(null);
      setPreviewFotoDocumentoVeiculo(null);
      setPreviewFotoCnh(null);
      setPreviewFotoComprovanteEndereco(null);
      
      // Limpar o input de arquivo
      const inputFile = document.getElementById('foto-input') as HTMLInputElement;
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

  // Função específica para carregar dados completos com anexos
  const carregarDadosCompletos = () => {
    if (!busca.trim()) {
      alert("📝 Digite um termo de busca primeiro");
      return;
    }

    // Forçar carregamento completo no formulário
    realizarBusca(busca, true, true);
  };

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoTermo = e.target.value;
    setBusca(novoTermo);
    
    // Realizar busca em tempo real
    // No desktop (largura > 768px), carregar automaticamente no formulário
    // No mobile, apenas filtrar
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
    realizarBusca(novoTermo, false, isDesktop);
  };

  // Função para carregar um resultado específico no formulário
  const carregarResultadoNoFormulario = (resultado: VehicleData) => {
    setForm(resultado);
    setPreviewFoto(resultado.fotoUrl);
    setPreviewFotoDocumentoVeiculo(resultado.fotoDocumentoVeiculoUrl || null);
    setPreviewFotoCnh(resultado.fotoCnhUrl || null);
    setPreviewFotoComprovanteEndereco(resultado.fotoComprovanteEnderecoUrl || null);
    setEditandoId(resultado.id);
    setEdicaoManual(true); // Edição manual explícita
    
    // Fechar sidebar em mobile para visualizar o formulário
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarAberta(false);
    }
  };

  const handleEditar = (id: string) => {
    const encontrado = resultados.find((v) => v.id === id);
    if (encontrado) {
      setForm(encontrado);
      setPreviewFoto(encontrado.fotoUrl);
      setPreviewFotoDocumentoVeiculo(encontrado.fotoDocumentoVeiculoUrl || null);
      setPreviewFotoCnh(encontrado.fotoCnhUrl || null);
      setPreviewFotoComprovanteEndereco(encontrado.fotoComprovanteEnderecoUrl || null);
      setEditandoId(id);
      setEdicaoManual(true); // Edição manual explícita
    }
  };

  const handleExcluir = (id: string) => {
    if (typeof window === 'undefined') return;
    
    // Carregar todos os dados do localStorage para garantir que temos a lista completa
    const todosOsDados = JSON.parse(localStorage.getItem("veiculos") || "[]");
    
    // Encontrar o veículo que será excluído
    const veiculo = todosOsDados.find((v: VehicleData) => v.id === id);
    
    if (!veiculo) {
      alert("Veículo não encontrado!");
      return;
    }

    // Mostrar alerta de confirmação com detalhes do veículo
    const mensagem = `⚠️ CONFIRMAR EXCLUSÃO ⚠️\n\n` +
      `Você tem certeza que deseja EXCLUIR permanentemente este veículo?\n\n` +
      `📋 DADOS DO VEÍCULO:\n` +
      `🚗 Placa: ${veiculo.placa}\n` +
      `👤 Condutor: ${veiculo.condutor}\n` +
      `🚙 Modelo: ${veiculo.modelo} (${veiculo.cor})\n` +
      `📄 Documento: ${veiculo.documento}\n\n` +
      `❌ Esta ação NÃO PODE ser desfeita!\n\n` +
      `Clique "OK" para EXCLUIR ou "Cancelar" para manter o registro.`;

    const confirmar = window.confirm(mensagem);
    
    if (confirmar) {
      // Se está editando este item, cancelar a edição
      if (editandoId === id) {
        setEditandoId(null);
        setEdicaoManual(false);
        setForm({
          id: "",
          tipo: "carro",
          placa: "",
          modelo: "",
          ano: "",
          cor: "",
          condutor: "",
          documento: "",
          telefone: "",
          profissao: "",
          tipoContrato: "mensalista",
          localEstacionamento: "",
          dataEntrada: "",
          horaEntrada: "",
          duracaoMinutos: 60,
          fotoUrl: "",
        });
        setPreviewFoto(null);
        
        // Limpar o input de arquivo
        const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
        if (inputFile) {
          inputFile.value = '';
        }
      }
      
      // Remover o veículo da lista completa de dados
      const atualizados = todosOsDados.filter((v: VehicleData) => v.id !== id);
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("veiculos", JSON.stringify(atualizados));
      }
      
      // Atualizar estado dos resultados
      setResultados(atualizados);
      
      // Se há busca ativa, limpar para mostrar todos os dados
      if (busca) {
        setBusca("");
      }
      
      // Mostrar mensagem de sucesso
      setTimeout(() => {
        alert(`✅ Veículo excluído com sucesso!\n\nPlaca: ${veiculo.placa}\nCondutor: ${veiculo.condutor}`);
      }, 100);
      
    } else {
      // Mostrar mensagem de cancelamento
      alert(`❌ Exclusão cancelada.\n\nO veículo ${veiculo.placa} foi mantido no sistema.`);
    }
  };

  // Função para normalizar texto (remover acentos e converter para minúsculo)
  const normalizarTexto = (texto: string) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Função para formatar placa brasileira
  const formatarPlaca = (valor: string) => {
    // Remove tudo que não for letra ou número
    const apenasLetrasNumeros = valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Limita a 7 caracteres
    const limitado = apenasLetrasNumeros.slice(0, 7);
    
    // Se tem até 3 caracteres, só aceita letras
    if (limitado.length <= 3) {
      return limitado.replace(/[^A-Z]/g, '');
    }
    
    // Se tem 4 a 7 caracteres, aplica a lógica de formatação
    if (limitado.length >= 4) {
      const letras = limitado.slice(0, 3).replace(/[^A-Z]/g, '');
      const resto = limitado.slice(3);
      
      // Detecta se é padrão antigo ou novo baseado no 5º caractere
      if (limitado.length >= 5) {
        const quintoChar = limitado[4];
        
        if (/[A-Z]/.test(quintoChar)) {
          // Padrão novo: ABC1D23
          let resultado = letras;
          if (resto.length >= 1) resultado += resto[0].replace(/[^0-9]/g, ''); // 4º: número
          if (resto.length >= 2) resultado += resto[1].replace(/[^A-Z]/g, ''); // 5º: letra
          if (resto.length >= 3) resultado += resto.slice(2, 4).replace(/[^0-9]/g, ''); // 6º-7º: números
          return resultado;
        } else {
          // Padrão antigo: ABC1234
          const numeros = resto.replace(/[^0-9]/g, '');
          return letras + numeros;
        }
      } else {
        // Ainda não determinou o padrão, aceita qualquer
        return letras + resto;
      }
    }
    
    return limitado;
  };

  // Função para validar placa brasileira
  const validarPlaca = (placa: string) => {
    if (!placa || placa.length < 7) return false;
    
    const placaSemHifen = placa.replace('-', '');
    
    // Padrão antigo: ABC1234
    const padraoAntigo = /^[A-Z]{3}[0-9]{4}$/;
    
    // Padrão novo Mercosul: ABC1D23
    const padraoNovo = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
    
    return padraoAntigo.test(placaSemHifen) || padraoNovo.test(placaSemHifen);
  };

  // Função para tratar mudança na placa
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const placaFormatada = formatarPlaca(valor);
    
    setForm(prev => ({ ...prev, placa: placaFormatada }));
  };

  // Função para exibir placa formatada na tabela
  const exibirPlacaFormatada = (placa: string) => {
    // Se já tem hífen, retorna como está
    if (placa.includes('-')) {
      return placa;
    }
    
    // Se tem 7 caracteres e é padrão antigo, adiciona hífen
    if (placa.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(placa)) {
      return placa.slice(0, 3) + '-' + placa.slice(3);
    }
    
    // Retorna como está (padrão Mercosul ou incompleto)
    return placa;
  };

  // Função para formatar duração na tabela
  const formatarDuracao = (minutos: number) => {
    if (minutos === 43200) {
      return "30 dias";
    } else if (minutos >= 1440) {
      const dias = Math.floor(minutos / 1440);
      return `${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      if (minutosRestantes === 0) {
        return `${horas}h`;
      } else {
        return `${horas}h ${minutosRestantes}min`;
      }
    } else {
      return `${minutos} min`;
    }
  };

  // Função para calcular o tempo excedido
  const calcularTempoExcedido = (dataEntrada: string, horaEntrada: string, duracaoMinutos: number, tipoContrato: string = "mensalista") => {
    if (!dataEntrada) return "0 min";

    // Combinar data e hora para criar o timestamp completo
    const horaCompleta = horaEntrada || "00:00";
    const dataHoraEntrada = new Date(`${dataEntrada}T${horaCompleta}:00`);
    const agora = tempoAtual;
    
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, não há tempo excedido ainda
    if (diferencaMinutos < 0) {
      return "Aguardando início";
    }
    
    // Calcular tempo excedido baseado SEMPRE na duração específica escolhida
    const tempoExcedido = diferencaMinutos - duracaoMinutos;
    
    // Se ainda não excedeu o tempo permitido
    if (tempoExcedido <= 0) {
      return "Dentro do prazo";
    }
    
    // Formatação baseada na magnitude do tempo excedido
    if (tempoExcedido < 60) {
      return `${tempoExcedido} min`;
    } else if (tempoExcedido < 1440) {
      const horas = Math.floor(tempoExcedido / 60);
      const minutos = tempoExcedido % 60;
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    } else {
      const dias = Math.floor(tempoExcedido / 1440);
      const horas = Math.floor((tempoExcedido % 1440) / 60);
      if (horas > 0) {
        return `${dias}d ${horas}h`;
      } else {
        return `${dias} dia${dias > 1 ? 's' : ''}`;
      }
    }
  };

  // Função para obter a classe CSS do tempo decorrido
  const obterClasseTempoDecorrido = (dataEntrada: string) => {
    if (!dataEntrada) return styles.tempoDecorrido;

    const dataHoraEntrada = new Date(`${dataEntrada}T00:00:00`);
    const agora = tempoAtual;
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, usar classe especial
    if (diferencaMinutos < 0) {
      return styles.tempoFuturo || styles.tempoDecorrido;
    }
    
    return styles.tempoDecorrido;
  };

  // Função para obter a classe CSS baseada no tempo excedido
  const obterClasseTempoExcedido = (dataEntrada: string, horaEntrada: string, duracaoMinutos: number, tipoContrato: string = "mensalista") => {
    if (!dataEntrada) return styles.tempoExcedido;

    // Combinar data e hora para criar o timestamp completo
    const horaCompleta = horaEntrada || "00:00";
    const dataHoraEntrada = new Date(`${dataEntrada}T${horaCompleta}:00`);
    const agora = tempoAtual;
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, usar classe especial
    if (diferencaMinutos < 0) {
      return styles.tempoFuturo || styles.tempoNormal;
    }
    
    // Calcular tempo excedido sempre baseado na duração específica
    const tempoExcedido = diferencaMinutos - duracaoMinutos;
    
    // Se ainda não excedeu o tempo permitido
    if (tempoExcedido <= 0) {
      return styles.tempoNormal;
    }
    
    // Definir tolerâncias baseadas na duração específica
    let toleranciaLeve, toleranciaMedio;
    
    if (duracaoMinutos <= 60) {
      // Para durações de até 1 hora: tolerância menor
      toleranciaLeve = Math.floor(duracaoMinutos * 0.25); // 25% da duração
      toleranciaMedio = Math.floor(duracaoMinutos * 0.5); // 50% da duração
    } else if (duracaoMinutos <= 1440) {
      // Para durações de até 1 dia: tolerância em horas
      toleranciaLeve = 60; // 1 hora
      toleranciaMedio = 180; // 3 horas
    } else {
      // Para durações maiores (mensais): tolerância em dias
      toleranciaLeve = 1440; // 1 dia
      toleranciaMedio = 4320; // 3 dias
    }
    
    if (tempoExcedido <= toleranciaLeve) {
      return styles.tempoExcedidoLeve;
    } else if (tempoExcedido <= toleranciaMedio) {
      return styles.tempoExcedidoMedio;
    } else {
      return styles.tempoExcedidoGrave;
    }
  };

  // Função para calcular o tempo permitido (duração formatada)
  const calcularTempoPermitido = (duracaoMinutos: number) => {
    if (duracaoMinutos < 60) {
      return `${duracaoMinutos} min`;
    } else if (duracaoMinutos < 1440) {
      const horas = Math.floor(duracaoMinutos / 60);
      const minutos = duracaoMinutos % 60;
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    } else {
      const dias = Math.floor(duracaoMinutos / 1440);
      const horas = Math.floor((duracaoMinutos % 1440) / 60);
      if (horas > 0) {
        return `${dias}d ${horas}h`;
      } else {
        return `${dias} dia${dias > 1 ? 's' : ''}`;
      }
    }
  };

  // Função para calcular o tempo decorrido total
  const calcularTempoDecorrido = (dataEntrada: string, tipoContrato: string = "mensalista") => {
    if (!dataEntrada) return "0 dias";

    const dataHoraEntrada = new Date(`${dataEntrada}T00:00:00`);
    const agora = new Date();
    
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
    // Se o tempo é negativo (entrada futura), mostrar tempo restante até o início
    if (diferencaDias < 0) {
      const diasRestantes = Math.abs(diferencaDias);
      return `Inicia em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
    }
    
    // Tempo normal (passado) - formatação em dias
    if (diferencaDias === 0) {
      return "Hoje";
    } else if (diferencaDias === 1) {
      return "1 dia";
    } else {
      return `${diferencaDias} dias`;
    }
  };

  const handleCancelarEdicao = () => {
    setBusca("");
    carregarDados();
    
    // Se estiver editando devido a uma busca, limpar o formulário também (mas sem recursão)
    if (editandoId) {
      setEditandoId(null);
      setEdicaoManual(false);
      setForm({
        id: "",
        tipo: "carro",
        placa: "",
        modelo: "",
        ano: "",
        cor: "",
        condutor: "",
        documento: "",
        telefone: "",
        profissao: "",
        tipoContrato: "mensalista",
        localEstacionamento: "",
        dataEntrada: "",
        horaEntrada: "",
        duracaoMinutos: 60,
        fotoUrl: "",
        fotoDocumentoVeiculoUrl: "",
        fotoCnhUrl: "",
        fotoComprovanteEnderecoUrl: "",
      });
      setPreviewFoto(null);
      setPreviewFotoDocumentoVeiculo(null);
      setPreviewFotoCnh(null);
      setPreviewFotoComprovanteEndereco(null);
      
      // Limpar o input de arquivo
      const inputFile = document.getElementById('foto-input') as HTMLInputElement;
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

  const preencherDataHoraAtual = () => {
    const agora = new Date();
    const dataAtual = agora.toISOString().split('T')[0];
    const horaAtual = agora.toTimeString().slice(0, 5); // HH:MM
    
    setForm(prev => ({
      ...prev,
      dataEntrada: dataAtual,
      horaEntrada: horaAtual
    }));
  };

  const removerFoto = () => {
    setForm(prev => ({ ...prev, fotoUrl: "" }));
    setPreviewFoto(null);
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const exportarParaPDF = () => {
    if (resultados.length === 0) {
      alert("Não há dados para exportar!");
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4'); // A4 paisagem
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Configurar título
      doc.setFontSize(16);
      doc.text('Relatório de Veículos - Hotel Parking', pageWidth / 2, 15, { align: 'center' });
      
      // Adicionar data de geração
      doc.setFontSize(10);
      const dataAtual = new Date().toLocaleString('pt-BR');
      doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, 25, { align: 'center' });
      
      // Tabela única com dados essenciais na sequência solicitada
      const colunas = [
        'Condutor', 'Placa', 'Tipo', 'Modelo', 'Data Entrada', 
        'Hora Entrada', 'Local', 'Tempo Permitido', 'Status'
      ];

      const linhas = resultados.map(v => {
        const tempoExcedido = calcularTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos, v.tipoContrato);
        let status = 'Normal';
        if (tempoExcedido.includes('Dentro do prazo')) {
          status = 'OK';
        } else if (tempoExcedido !== 'Dentro do prazo' && tempoExcedido !== 'Aguardando início') {
          status = 'Excedido';
        } else if (tempoExcedido.includes('Aguardando')) {
          status = 'Agendado';
        }

        return [
          v.condutor.length > 20 ? v.condutor.substring(0, 20) + '...' : v.condutor,
          v.placa,
          v.tipo.charAt(0).toUpperCase() + v.tipo.slice(1),
          v.modelo.length > 16 ? v.modelo.substring(0, 16) + '...' : v.modelo,
          v.dataEntrada ? new Date(v.dataEntrada).toLocaleDateString('pt-BR') : '-',
          v.horaEntrada || '-',
          v.localEstacionamento.length > 14 ? v.localEstacionamento.substring(0, 14) + '...' : v.localEstacionamento || '-',
          formatarDuracao(v.duracaoMinutos),
          status
        ];
      });

      // Gerar tabela única
      autoTable(doc, {
        head: [colunas],
        body: linhas,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: 'ellipsize',
          halign: 'center',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [25, 34, 48],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'center' }, // Condutor
          1: { cellWidth: 25, halign: 'center' }, // Placa
          2: { cellWidth: 20, halign: 'center' }, // Tipo
          3: { cellWidth: 40, halign: 'center' }, // Modelo
          4: { cellWidth: 25, halign: 'center' }, // Data Entrada
          5: { cellWidth: 25, halign: 'center' }, // Hora Entrada
          6: { cellWidth: 30, halign: 'center' }, // Local
          7: { cellWidth: 30, halign: 'center' }, // Tempo Permitido
          8: { cellWidth: 25, halign: 'center' }, // Status
        },
        margin: { top: 35, right: 10, bottom: 20, left: 10 },
        tableWidth: 'auto',
        didDrawCell: (data) => {
          // Colorir células de status
          if (data.column.index === 8 && data.section === 'body') {
            const status = data.cell.text[0];
            if (status === 'Excedido') {
              data.cell.styles.fillColor = [255, 235, 238]; // Vermelho claro
              data.cell.styles.textColor = [196, 48, 43]; // Vermelho escuro
            } else if (status === 'OK') {
              data.cell.styles.fillColor = [236, 253, 245]; // Verde claro
              data.cell.styles.textColor = [5, 150, 105]; // Verde escuro
            } else if (status === 'Agendado') {
              data.cell.styles.fillColor = [254, 249, 195]; // Amarelo claro
              data.cell.styles.textColor = [146, 64, 14]; // Laranja escuro
            }
          }
        },
      });

      // Adicionar rodapé em todas as páginas
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        const text = `Página ${i} de ${totalPages} - Total de registros: ${resultados.length}`;
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, pageHeight - 10);
      }

      // Salvar o PDF
      const nomeArquivo = `veiculos_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);

      alert(`✅ Dados exportados com sucesso!\n\nArquivo: ${nomeArquivo}\nTotal de registros: ${resultados.length}\n\nRelatório resumido com dados essenciais gerado.`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar o arquivo PDF. Tente novamente.');
    }
  };

  const excluirTodosDados = () => {
    if (typeof window === 'undefined') return;
    
    // Carregar dados atuais do localStorage
    const dadosAtuais = JSON.parse(localStorage.getItem("veiculos") || "[]");
    
    if (dadosAtuais.length === 0) {
      alert("Não há dados para excluir!");
      return;
    }

    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO - EXCLUSÃO TOTAL ⚠️\n\n` +
      `Você tem certeza que deseja EXCLUIR TODOS os ${dadosAtuais.length} veículo(s) cadastrado(s)?\n\n` +
      `❌ Esta ação NÃO PODE ser desfeita!\n` +
      `❌ TODOS os dados serão perdidos permanentemente!\n\n` +
      `Clique "OK" para EXCLUIR TUDO ou "Cancelar" para manter os dados.`
    );

    if (confirmacao) {
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("veiculos");
      }
      
      // Atualizar estados
      setResultados([]);
      
      // Se estiver editando, cancelar edição
      if (editandoId) {
        setEditandoId(null);
        setEdicaoManual(false);
        setForm({
          id: "",
          tipo: "carro",
          placa: "",
          modelo: "",
          ano: "",
          cor: "",
          condutor: "",
          documento: "",
          telefone: "",
          profissao: "",
          tipoContrato: "mensalista",
          localEstacionamento: "",
          dataEntrada: "",
          horaEntrada: "",
          duracaoMinutos: 60,
          fotoUrl: "",
        });
        setPreviewFoto(null);
      }
      
      // Limpar busca e resultados
      setBusca("");
      setResultados([]);
      
      alert(`✅ Todos os dados foram excluídos com sucesso!\n\nTotal de ${dadosAtuais.length} veículo(s) removido(s).`);
    } else {
      alert("❌ Exclusão cancelada. Todos os dados foram mantidos.");
    }
  };

  return (
    <div className={styles.appLayout}>
      {/* Botão toggle para mobile - sempre visível */}
      <button 
        className={styles.sidebarToggle}
        onClick={toggleSidebar}
        aria-label={sidebarAberta ? "Fechar menu" : "Abrir menu"}
      >
        {sidebarAberta ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay para fechar sidebar no mobile */}
      <div 
        className={`${styles.sidebarOverlay} ${sidebarAberta ? styles.active : ''}`}
        onClick={handleOverlayClick}
      />

      {/* Sidebar moderna */}
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
                <span>Controle de Acesso</span>
            </Link>
            <Link 
              href="/cadastro-pessoal" 
              className={`${styles.navLink} ${pathname === "/cadastro-pessoal" ? styles.activeNav : ""}`}
              onClick={fecharSidebar}
            >
              <FaUser className={styles.navIcon} />
                <span>Cadastrar Hóspede</span>
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
          <h3 className={styles.sectionTitle}>Buscar</h3>
          <div className={styles.buscaWrapper}>
            <input
              type="text"
              placeholder="Condutor, placa, modelo..."
              value={busca}
              onChange={handleBuscaChange}
            />
            <button 
              className={styles.searchBtn} 
              onClick={() => realizarBusca(busca, true, true)} 
              title="Buscar e carregar dados completos"
            >
              <span className={styles.searchIcon}>�</span>
              <span className={styles.searchText}>Buscar</span>
            </button>
          </div>
          {busca && (
            <div className={styles.searchButtons}>
              <button className={styles.limparBtn} onClick={limparBusca} title="Limpar busca">
                Limpar Busca
              </button>
            </div>
          )}
        </div>

        {/* Seção de estatísticas */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Estatísticas</h3>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total de Veículos</span>
              <span className={styles.statNumber}>{typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("veiculos") || "[]").length : 0}</span>
            </div>
          </div>
          {busca && (
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Resultados da Busca</span>
                <span className={styles.statNumber}>{resultados.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Seção de resultados da busca */}
        {busca && resultados.length > 0 && (
          <div className={styles.resultsSection}>
            <h3 className={styles.sectionTitle}>Resultados</h3>
            <div className={styles.resultsList}>
              {resultados.slice(0, 5).map((resultado, index) => (
                <div 
                  key={resultado.id} 
                  className={`${styles.resultCard} ${editandoId === resultado.id ? styles.active : ''}`}
                >
                  <div className={styles.resultInfo}>
                    <div className={styles.resultTitle}>
                      {resultado.placa} - {resultado.condutor}
                    </div>
                    <div className={styles.resultDetails}>
                      {resultado.modelo}
                    </div>
                  </div>
                  <button 
                    className={styles.loadBtn}
                    onClick={() => carregarResultadoNoFormulario(resultado)}
                    title="Carregar no formulário"
                  >
                    📝
                  </button>
                </div>
              ))}
              {resultados.length > 5 && (
                <div className={styles.moreResults}>
                  E mais {resultados.length - 5} resultado(s)...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção de ações */}
        <div className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Ações</h3>
          <button onClick={exportarParaPDF} className={styles.actionButton} title="Exportar dados para PDF">
            Exportar PDF
          </button>
          <button onClick={excluirTodosDados} className={styles.actionButtonDanger} title="Excluir todos os dados">
            Excluir Todos
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>Cadastro de Veículo</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <label>
            Tipo:
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              <option value="carro">Carro</option>
              <option value="moto">Moto</option>
              <option value="caminhao">Caminhão</option>
            </select>
          </label>

          <label>
            Placa:
            <input 
              type="text" 
              name="placa" 
              value={form.placa} 
              onChange={handlePlacaChange}
              placeholder="ABC-1234 ou ABC1D23"
              maxLength={8}
              required 
            />
            {form.placa && !validarPlaca(form.placa) && form.placa.length >= 6 && (
              <span className={styles.placaError}>
                ⚠️ Formato inválido. Use: ABC1234 ou ABC1D23
              </span>
            )}
          </label>

          <label>
            Modelo:
            <input type="text" name="modelo" value={form.modelo} onChange={handleChange} required />
          </label>

          <label>
            Cor:
            <input type="text" name="cor" value={form.cor} onChange={handleChange} required />
          </label>

          <label>
            Ano:
            <input type="text" name="ano" value={form.ano} onChange={handleChange} required pattern="[0-9]{4}" maxLength={4} placeholder="2025" />
          </label>
        </div>

        {/* Seção para documentos */}
        <div className={styles.documentosSection}>
          <h3 className={styles.sectionTitle}>Documentos</h3>
          <div className={styles.documentosContainer}>
            {/* Documento do Veículo */}
            <div className={styles.documentoItem}>
              <h4 className={styles.documentoTitulo}>Documento do Veículo</h4>
              <label htmlFor="foto-input-documento" className={styles.fotoPreview} style={{ cursor: 'pointer' }}>
                {previewFotoDocumentoVeiculo ? (
                  editandoId ? (
                    // Modo de visualização quando editando (busca)
                    <div className={styles.documentoVisualizacao} onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      ampliarFotoDocumento();
                    }}>
                      <span className={styles.documentoIcon}>📄</span>
                      <p>Documento Anexado</p>
                      <small>Clique aqui para visualizar</small>
                    </div>
                  ) : (
                    // Modo de preview normal
                    isPDFUrl(previewFotoDocumentoVeiculo) ? (
                      <div className={styles.pdfPreview} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ampliarFotoDocumento();
                      }}>
                        <span className={styles.pdfIcon}>📄</span>
                        <p>Documento PDF</p>
                        <small>Clique para visualizar</small>
                      </div>
                    ) : (
                      <img 
                        src={previewFotoDocumentoVeiculo} 
                        alt="Documento do Veículo" 
                        className={styles.previewImage}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          ampliarFotoDocumento();
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ampliar"
                      />
                    )
                  )
                ) : (
                  <div className={styles.placeholderFoto}>
                    <span>📄</span>
                    <p>Clique para anexar documento (IMG/PDF)</p>
                  </div>
                )}
                <input
                  id="foto-input-documento"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFotoDocumentoChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* CNH */}
            <div className={styles.documentoItem}>
              <h4 className={styles.documentoTitulo}>CNH</h4>
              <label htmlFor="foto-input-cnh" className={styles.fotoPreview} style={{ cursor: 'pointer' }}>
                {previewFotoCnh ? (
                  editandoId ? (
                    // Modo de visualização quando editando (busca)
                    <div className={styles.documentoVisualizacao} onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      ampliarFotoCnh();
                    }}>
                      <span className={styles.documentoIcon}>🆔</span>
                      <p>CNH Anexada</p>
                      <small>Clique aqui para visualizar</small>
                    </div>
                  ) : (
                    // Modo de preview normal
                    isPDFUrl(previewFotoCnh) ? (
                      <div className={styles.pdfPreview} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ampliarFotoCnh();
                      }}>
                        <span className={styles.pdfIcon}>🆔</span>
                        <p>CNH PDF</p>
                        <small>Clique para visualizar</small>
                      </div>
                    ) : (
                      <img 
                        src={previewFotoCnh} 
                        alt="CNH" 
                        className={styles.previewImage}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          ampliarFotoCnh();
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ampliar"
                      />
                    )
                  )
                ) : (
                  <div className={styles.placeholderFoto}>
                    <span>🆔</span>
                    <p>Clique para anexar CNH (IMG/PDF)</p>
                  </div>
                )}
                <input
                  id="foto-input-cnh"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFotoCnhChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Comprovante de Endereço */}
            <div className={styles.documentoItem}>
              <h4 className={styles.documentoTitulo}>Comprovante de Endereço</h4>
              <label htmlFor="foto-input-comprovante" className={styles.fotoPreview} style={{ cursor: 'pointer' }}>
                {previewFotoComprovanteEndereco ? (
                  editandoId ? (
                    // Modo de visualização quando editando (busca)
                    <div className={styles.documentoVisualizacao} onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      ampliarFotoComprovanteEndereco();
                    }}>
                      <span className={styles.documentoIcon}>🏠</span>
                      <p>Comprovante Anexado</p>
                      <small>Clique aqui para visualizar</small>
                    </div>
                  ) : (
                    // Modo de preview normal
                    isPDFUrl(previewFotoComprovanteEndereco) ? (
                      <div className={styles.pdfPreview} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ampliarFotoComprovanteEndereco();
                      }}>
                        <span className={styles.pdfIcon}>🏠</span>
                        <p>Comprovante PDF</p>
                        <small>Clique para visualizar</small>
                      </div>
                    ) : (
                      <img 
                        src={previewFotoComprovanteEndereco} 
                        alt="Comprovante de Endereço" 
                        className={styles.previewImage}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          ampliarFotoComprovanteEndereco();
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ampliar"
                      />
                    )
                  )
                ) : (
                  <div className={styles.placeholderFoto}>
                    <span>🏠</span>
                    <p>Clique para anexar comprovante (IMG/PDF)</p>
                  </div>
                )}
                <input
                  id="foto-input-comprovante"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFotoComprovanteEnderecoChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className={styles.duracaoAgoraWrapper}>
          <label>
            Local Estacionado:
            <input 
              type="text" 
              name="localEstacionamento" 
              value={form.localEstacionamento} 
              onChange={handleChange}
              placeholder="Ex: Vaga 15, Pátio A, Subsolo"
            />
          </label>

          <label>
            Data Entrada:
            <input type="date" name="dataEntrada" value={form.dataEntrada} onChange={handleChange} />
          </label>

          <label>
            Hora Entrada:
            <input type="time" name="horaEntrada" value={form.horaEntrada} onChange={handleChange} />
          </label>

          <label className={styles.duracaoLabel}>
            Duração:
            <select name="duracaoMinutos" value={form.duracaoMinutos} onChange={handleChange}>
              {form.tipoContrato === "por_hora" ? (
                // Opções para contratos por hora (máximo 12 horas)
                <>
                  <option value={60}>1 hora ⭐ Recomendado</option>
                  <option value={120}>2 horas</option>
                  <option value={240}>4 horas</option>
                  <option value={480}>8 horas</option>
                  <option value={720}>12 horas</option>
                </>
              ) : (
                // Opções para mensalistas e outros tipos
                <>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                  <option value={240}>4 horas</option>
                  <option value={480}>8 horas</option>
                  <option value={720}>12 horas</option>
                  <option value={1440}>24 horas</option>
                  <option value={43200}>30 dias {form.tipoContrato === "mensalista" ? "⭐ Recomendado" : ""}</option>
                </>
              )}
            </select>
            {form.tipoContrato && (
              <small className={styles.duracaoHint}>
                {form.tipoContrato === "mensalista" && "💡 Mensalistas: Recomendado 30 dias"}
                {form.tipoContrato === "por_hora" && "💡 Por Hora: Duração limitada a 12 horas máximo"}
              </small>
            )}
          </label>
          <button type="button" onClick={preencherDataHoraAtual} className={styles.agoraButton}>
            🕐 Agora
          </button>
        </div>

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

          {/* Modal da câmera */}
          {mostrandoCamera === 'pessoa' && (
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

          {/* Modal para documento ampliado */}
          {fotoAmpliada && (
            <div className={styles.fotoAmpliadaModal} onClick={fecharFotoAmpliada}>
              <div className={styles.fotoAmpliadaContent}>
                {isPDFUrl(fotoAmpliada) ? (
                  <iframe 
                    src={fotoAmpliada} 
                    className={styles.pdfAmpliadoFrame}
                    title="Documento PDF"
                  />
                ) : (
                  <img src={fotoAmpliada} alt="Documento Ampliado" className={styles.fotoAmpliadaImage} />
                )}
                <button onClick={fecharFotoAmpliada} className={styles.fecharAmpliadaButton}>
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className={styles.dadosPessoais}>
            <div className={styles.formRow}>
              <label>
                Nome:
                <input
                  type="text"
                  name="condutor"
                  value={form.condutor}
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

            <div className={`${styles.formRow} ${styles.compactRow}`}>
              <label className={styles.telField}>
                Tel/Cel:
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(99) 9 9999-9999"
                />
              </label>

              <label className={styles.profissaoField}>
                Profissão:
                <input
                  type="text"
                  name="profissao"
                  value={form.profissao}
                  onChange={handleChange}
                  placeholder="Lojista"
                />
              </label>

            </div>
          </div>
        </div>

        <div className={styles.formButtons}>
          <button type="submit" className={styles.submitButton}>
            {editandoId ? "Atualizar Dados" : "Cadastrar Veículo"}
          </button>
          {editandoId && editacaoManual && (
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={handleCancelarEdicao}
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </form>

      <div className={styles.scrollWrapper}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Condutor</th>
              <th>Tipo</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Cor</th>
              <th>Data Entrada</th>
              <th>Tempo Permitido</th>
              <th>Tempo<br />Decorrido</th>
              <th>Tempo Excedido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((v) => (
              <tr key={v.id}>
                <td>
                  {v.fotoUrl && <img src={v.fotoUrl} alt="Foto" className={styles.fotoMini} />}
                </td>
                <td>{v.condutor}</td>
                <td>{v.tipo.charAt(0).toUpperCase() + v.tipo.slice(1)}</td>
                <td className={styles.placaCell}>{exibirPlacaFormatada(v.placa)}</td>
                <td>{v.modelo}</td>
                <td>{v.cor}</td>
                <td>{v.dataEntrada}</td>
                <td className={v.duracaoMinutos === 43200 ? styles.duracaoMensal : ''}>
                  {calcularTempoPermitido(v.duracaoMinutos)}
                </td>
                <td className={obterClasseTempoDecorrido(v.dataEntrada)}>
                  {calcularTempoDecorrido(v.dataEntrada, v.tipoContrato)}
                </td>
                <td className={obterClasseTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos, v.tipoContrato)}>
                  {calcularTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos, v.tipoContrato)}
                </td>
                <td className={styles.acoesCell}>
                  <button 
                    type="button"
                    onClick={() => handleEditar(v.id)} 
                    title="Editar Veículo"
                    className={styles.editButton}
                  >
                    ✏️
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleExcluir(v.id)} 
                    title="Excluir Veículo"
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
        </div>
      </main>
    </div>
  );
}

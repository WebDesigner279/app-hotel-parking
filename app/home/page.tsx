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
  marca: string;
  ano: string;
  cor: string;
  vaga: string;
  condutor: string;
  documento: string;
  telefone: string;
  email: string;
  profissao: string;
  tipoContrato: string;
  horaEntrada: string;
  dataEntrada: string;
  duracaoMinutos: number;
  fotoUrl: string;
}

export default function VehicleFormPage() {
  const pathname = usePathname();
  const [form, setForm] = useState<VehicleData>({
    id: "",
    tipo: "carro",
    placa: "",
    modelo: "",
    marca: "",
    ano: "",
    cor: "",
    vaga: "",
    condutor: "",
    documento: "",
    telefone: "",
    email: "",
    profissao: "",
    tipoContrato: "mensalista",
    horaEntrada: "",
    dataEntrada: "",
    duracaoMinutos: 60,
    fotoUrl: "",
  });

  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<VehicleData[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editacaoManual, setEdicaoManual] = useState(false); // Distingue edição manual da busca automática
  const [tempoAtual, setTempoAtual] = useState(new Date());
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [mostrarOpcoesFoto, setMostrarOpcoesFoto] = useState(false);
  const [streamCamera, setStreamCamera] = useState<MediaStream | null>(null);
  const [mostrandoCamera, setMostrandoCamera] = useState(false);

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
    
    setForm((prev) => ({ ...prev, [name]: valorFormatado }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)');
        return;
      }
      
      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo é muito grande. Por favor, selecione uma imagem menor que 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setForm((prev) => ({ ...prev, fotoUrl: result }));
        setPreviewFoto(result);
        setMostrarOpcoesFoto(false); // Fechar menu após selecionar
      };
      reader.onerror = () => {
        alert('Erro ao carregar a imagem. Tente novamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para abrir câmera
  const abrirCamera = async () => {
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('📷 Câmera não disponível\n\nSeu navegador não suporta acesso à câmera ou você está acessando via HTTP.\n\nPara usar a câmera, acesse via HTTPS ou use um navegador compatível.');
        return;
      }

      // Solicitar permissão para usar a câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Câmera frontal por padrão
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStreamCamera(stream);
      setMostrandoCamera(true);
      setMostrarOpcoesFoto(false);

      // Aguardar um pouco para o estado ser atualizado antes de conectar o stream
      setTimeout(() => {
        const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      let mensagemErro = '📷 Erro ao acessar a câmera\n\n';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          mensagemErro += 'Permissão negada para acessar a câmera.\n\nPor favor, permita o acesso à câmera e tente novamente.';
        } else if (error.name === 'NotFoundError') {
          mensagemErro += 'Nenhuma câmera encontrada no dispositivo.';
        } else if (error.name === 'NotSupportedError') {
          mensagemErro += 'Câmera não suportada pelo navegador.';
        } else {
          mensagemErro += `Erro: ${error.message}`;
        }
      } else {
        mensagemErro += 'Erro desconhecido ao tentar acessar a câmera.';
      }
      
      alert(mensagemErro);
    }
  };

  // Função para tirar foto
  const tirarFoto = () => {
    const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvasElement = document.createElement('canvas');
    const context = canvasElement.getContext('2d');

    if (videoElement && context) {
      // Definir dimensões do canvas baseado no vídeo
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      // Desenhar o frame atual do vídeo no canvas
      context.drawImage(videoElement, 0, 0);

      // Converter para base64
      const fotoDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);

      // Salvar a foto
      setForm((prev) => ({ ...prev, fotoUrl: fotoDataUrl }));
      setPreviewFoto(fotoDataUrl);

      // Fechar câmera
      fecharCamera();

      alert('📷 Foto capturada com sucesso!');
    }
  };

  // Função para fechar câmera
  const fecharCamera = () => {
    if (streamCamera) {
      // Parar todas as tracks do stream
      streamCamera.getTracks().forEach(track => track.stop());
      setStreamCamera(null);
    }
    setMostrandoCamera(false);
  };

  // Função para alternar entre câmera frontal e traseira
  const alternarCamera = async () => {
    if (streamCamera) {
      // Parar stream atual
      streamCamera.getTracks().forEach(track => track.stop());
    }

    try {
      // Detectar qual câmera está sendo usada
      const videoTrack = streamCamera?.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      const facingMode = settings?.facingMode === 'user' ? 'environment' : 'user';

      const novoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStreamCamera(novoStream);

      setTimeout(() => {
        const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = novoStream;
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao alternar câmera:', error);
      alert('Erro ao alternar entre as câmeras. Usando câmera atual.');
    }
  };

  // Função para abrir galeria
  const abrirGaleria = () => {
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.click();
    }
    setMostrarOpcoesFoto(false);
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
      dataEntrada: form.dataEntrada || agora.toISOString().split('T')[0],
      horaEntrada: form.horaEntrada || agora.toTimeString().slice(0, 5)
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
      marca: "",
      ano: "",
      cor: "",
      vaga: "",
      condutor: "",
      documento: "",
      telefone: "",
      email: "",
      profissao: "",
      tipoContrato: "mensalista",
      horaEntrada: "",
      dataEntrada: "",
      duracaoMinutos: 60,
      fotoUrl: "",
    });
    setEditandoId(null);
    setEdicaoManual(false);
    setPreviewFoto(null);
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const realizarBusca = (termo: string, fecharSidebar: boolean = false, carregarNoFormulario: boolean = false) => {
    // Verificar se é mobile e se o termo está vazio quando acionado pelo botão
    if (fecharSidebar && !termo.trim() && typeof window !== 'undefined' && window.innerWidth <= 768) {
      alert("📝 Digite seu critério de busca\n\nVocê pode buscar por:\n• Nome do condutor\n• Placa do veículo\n• Modelo do veículo\n• Cor\n• Número da vaga\n• Documento\n• E-mail\n• Profissão");
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
            marca: "",
            ano: "",
            cor: "",
            vaga: "",
            condutor: "",
            documento: "",
            telefone: "",
            email: "",
            profissao: "",
            tipoContrato: "mensalista",
            horaEntrada: "",
            dataEntrada: "",
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
          normalizarTexto(item.marca).includes(termoNormalizado) ||
          normalizarTexto(item.cor).includes(termoNormalizado) ||
          normalizarTexto(item.vaga).includes(termoNormalizado) ||
          normalizarTexto(item.documento).includes(termoNormalizado) ||
          normalizarTexto(item.telefone).includes(termoNormalizado) ||
          normalizarTexto(item.email).includes(termoNormalizado) ||
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
            alert(`🔍 Nenhum resultado encontrado para: "${termo}"\n\nTente buscar por:\n• Nome do condutor\n• Placa do veículo\n• Modelo do veículo\n• Marca do veículo\n• Cor\n• Número da vaga\n• Documento\n• Telefone\n• E-mail\n• Profissão\n• Ano`);
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
              marca: "",
              ano: "",
              cor: "",
              vaga: "",
              condutor: "",
              documento: "",
              telefone: "",
              email: "",
              profissao: "",
              tipoContrato: "mensalista",
              horaEntrada: "",
              dataEntrada: "",
              duracaoMinutos: 60,
              fotoUrl: "",
            });
            setPreviewFoto(null);
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
        marca: "",
        ano: "",
        cor: "",
        vaga: "",
        condutor: "",
        documento: "",
        telefone: "",
        email: "",
        profissao: "",
        tipoContrato: "mensalista",
        horaEntrada: "",
        dataEntrada: "",
        duracaoMinutos: 60,
        fotoUrl: "",
        tipoImovel: "nenhum",
        numeroImovel: "",
        blocoLocal: "",
      });
      setPreviewFoto(null);
      
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
      `🅿️ Vaga: ${veiculo.vaga}\n` +
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
          marca: "",
          ano: "",
          cor: "",
          vaga: "",
          condutor: "",
          documento: "",
          telefone: "",
          email: "",
          profissao: "",
          tipoContrato: "mensalista",
          horaEntrada: "",
          dataEntrada: "",
          duracaoMinutos: 60,
          fotoUrl: "",
          tipoImovel: "nenhum",
          numeroImovel: "",
          blocoLocal: "",
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
    if (!dataEntrada || !horaEntrada) return "0 min";

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
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
  const obterClasseTempoDecorrido = (dataEntrada: string, horaEntrada: string) => {
    if (!dataEntrada || !horaEntrada) return styles.tempoDecorrido;

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
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
    if (!dataEntrada || !horaEntrada) return styles.tempoExcedido;

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
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
  const calcularTempoDecorrido = (dataEntrada: string, horaEntrada: string, tipoContrato: string = "mensalista") => {
    if (!dataEntrada || !horaEntrada) return "0 min";

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
    const agora = new Date();
    
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se o tempo é negativo (entrada futura), mostrar tempo restante até o início
    if (diferencaMinutos < 0) {
      const minutosRestantes = Math.abs(diferencaMinutos);
      if (minutosRestantes < 60) {
        return `Inicia em ${minutosRestantes} min`;
      } else if (minutosRestantes < 1440) {
        const horas = Math.floor(minutosRestantes / 60);
        const minutos = minutosRestantes % 60;
        return minutos > 0 ? `Inicia em ${horas}h ${minutos}min` : `Inicia em ${horas}h`;
      } else {
        const dias = Math.floor(minutosRestantes / 1440);
        const horas = Math.floor((minutosRestantes % 1440) / 60);
        if (horas > 0) {
          return `Inicia em ${dias}d ${horas}h`;
        } else {
          return `Inicia em ${dias} dia${dias > 1 ? 's' : ''}`;
        }
      }
    }
    
    // Tempo normal (passado) - formatação simples baseada na magnitude
    if (diferencaMinutos < 60) {
      return `${diferencaMinutos} min`;
    } else if (diferencaMinutos < 1440) {
      const horas = Math.floor(diferencaMinutos / 60);
      const minutos = diferencaMinutos % 60;
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    } else {
      const dias = Math.floor(diferencaMinutos / 1440);
      const horas = Math.floor((diferencaMinutos % 1440) / 60);
      if (horas > 0) {
        return `${dias}d ${horas}h`;
      } else {
        return `${dias} dia${dias > 1 ? 's' : ''}`;
      }
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setEdicaoManual(false);
    setForm({
      id: "",
      tipo: "carro",
      placa: "",
      modelo: "",
      marca: "",
      ano: "",
      cor: "",
      vaga: "",
      condutor: "",
      documento: "",
      telefone: "",
      email: "",
      profissao: "",
      tipoContrato: "mensalista",
      horaEntrada: "",
      dataEntrada: "",
      duracaoMinutos: 60,
      fotoUrl: "",
      tipoImovel: "nenhum",
      numeroImovel: "",
      blocoLocal: "",
    });
    setPreviewFoto(null);
    setBusca("");
    carregarDados();
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input-galeria') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const preencherDataHoraAtual = () => {
    const agora = new Date();
    const dataAtual = agora.toISOString().split('T')[0];
    const horaAtual = agora.toTimeString().slice(0, 5);
    
    setForm(prev => ({
      ...prev,
      dataEntrada: dataAtual,
      horaEntrada: horaAtual
    }));
  };

  const removerFoto = () => {
    setForm(prev => ({ ...prev, fotoUrl: "" }));
    setPreviewFoto(null);
    setMostrarOpcoesFoto(false);
    
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
      
      // Primeira tabela - Dados principais
      const colunasPrincipais = [
        'Tipo', 'Placa', 'Modelo', 'Cor', 'Vaga', 'Condutor', 
        'Documento', 'Telefone', 'Tipo Contrato'
      ];

      const linhasPrincipais = resultados.map(v => [
        v.tipo,
        v.placa,
        v.modelo || '-',
        v.cor || '-',
        v.vaga || '-',
        (v.condutor || '-').length > 20 ? (v.condutor || '-').substring(0, 20) + '...' : (v.condutor || '-'),
        v.documento || '-',
        v.telefone || '-',
        v.tipoContrato === 'mensalista' ? 'Mensalista' : 'Por Hora'
      ]);

      // Gerar primeira tabela
      autoTable(doc, {
        head: [colunasPrincipais],
        body: linhasPrincipais,
        startY: 35,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [25, 34, 48],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Tipo
          1: { cellWidth: 25 }, // Placa
          2: { cellWidth: 35 }, // Modelo
          3: { cellWidth: 20 }, // Cor
          4: { cellWidth: 15 }, // Vaga
          5: { cellWidth: 40 }, // Condutor
          6: { cellWidth: 30 }, // Documento
          7: { cellWidth: 30 }, // Telefone
          8: { cellWidth: 25 }, // Tipo Contrato
        },
        margin: { top: 35, right: 15, bottom: 20, left: 15 },
        tableWidth: 'auto',
        didDrawPage: (data) => {
          // Adicionar título da seção
          if (data.pageNumber === 1) {
            doc.setFontSize(12);
            doc.text('Dados Principais dos Veículos', 15, data.settings.startY - 10);
          }
        },
      });

      // Calcular posição para segunda tabela
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      
      // Segunda tabela - Dados de tempo
      const colunasTempos = [
        'Placa', 'Data Entrada', 'Hora Entrada', 'Tempo Permitido', 
        'Tempo Decorrido', 'Tempo Excedido'
      ];

      const linhasTempos = resultados.map(v => [
        v.placa,
        v.dataEntrada ? new Date(v.dataEntrada).toLocaleDateString('pt-BR') : '-',
        v.horaEntrada || '-',
        calcularTempoPermitido(v.duracaoMinutos),
        calcularTempoDecorrido(v.dataEntrada, v.horaEntrada, v.tipoContrato),
        calcularTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos, v.tipoContrato)
      ]);

      // Verificar se cabe na página atual ou precisa de nova página
      const espacoRestante = pageHeight - finalY - 40;
      const alturaEstimada = (linhasTempos.length + 2) * 8; // Estimativa de altura
      
      if (alturaEstimada > espacoRestante) {
        doc.addPage();
      }

      // Gerar segunda tabela
      autoTable(doc, {
        head: [colunasTempos],
        body: linhasTempos,
        startY: alturaEstimada > espacoRestante ? 30 : finalY + 20,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [25, 34, 48],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Placa
          1: { cellWidth: 30 }, // Data Entrada
          2: { cellWidth: 25 }, // Hora Entrada
          3: { cellWidth: 35 }, // Tempo Permitido
          4: { cellWidth: 35 }, // Tempo Decorrido
          5: { cellWidth: 35 }, // Tempo Excedido
        },
        margin: { top: 30, right: 15, bottom: 20, left: 15 },
        tableWidth: 'auto',
        didDrawPage: (data) => {
          // Adicionar título da seção
          doc.setFontSize(12);
          doc.text('Controle de Tempo', 15, data.settings.startY - 10);
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

      alert(`✅ Dados exportados com sucesso!\\n\\nArquivo: ${nomeArquivo}\\nTotal de registros: ${resultados.length}\\n\\nO relatório foi dividido em duas seções:\\n• Dados Principais dos Veículos\\n• Controle de Tempo`);
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
          marca: "",
          ano: "",
          cor: "",
          vaga: "",
          condutor: "",
          documento: "",
          telefone: "",
          email: "",
          profissao: "",
          tipoContrato: "mensalista",
          horaEntrada: "",
          dataEntrada: "",
          duracaoMinutos: 60,
          fotoUrl: "",
          tipoImovel: "nenhum",
          numeroImovel: "",
          blocoLocal: "",
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
          <h3 className={styles.sectionTitle}>Buscar Veículo</h3>
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
              title="Buscar"
            >
              <span className={styles.searchIcon}>🔍</span>
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
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total de Veículos</span>
              <span className={styles.statNumber}>{typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("veiculos") || "[]").length : 0}</span>
            </div>
          </div>
          {busca && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔍</div>
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
                      {resultado.modelo} • Vaga {resultado.vaga}
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
            � Exportar PDF
          </button>
          <button onClick={excluirTodosDados} className={styles.actionButtonDanger} title="Excluir todos os dados">
            🗑️ Excluir Todos
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
        </div>

        <div className={styles.formRow}>
          <label>
            Modelo:
            <input type="text" name="modelo" value={form.modelo} onChange={handleChange} required />
          </label>

          <label>
            Marca:
            <input type="text" name="marca" value={form.marca} onChange={handleChange} required />
          </label>

          <label>
            Ano:
            <input type="text" name="ano" value={form.ano} onChange={handleChange} required pattern="[0-9]{4}" maxLength={4} placeholder="2025" />
          </label>
        </div>

        <div className={styles.formRow}>
          <label>
            Cor:
            <input type="text" name="cor" value={form.cor} onChange={handleChange} required />
          </label>

          <label>
            Nº Vaga:
            <input type="text" name="vaga" value={form.vaga} onChange={handleChange} required />
          </label>
        </div>

        <div className={styles.duracaoAgoraWrapper}>
          <label>
            Hora Entrada:
            <input type="time" name="horaEntrada" value={form.horaEntrada} onChange={handleChange} />
          </label>

          <label>
            Data Entrada:
            <input type="date" name="dataEntrada" value={form.dataEntrada} onChange={handleChange} />
          </label>

          <label className={styles.duracaoLabel}>
            Duração:
            <select name="duracaoMinutos" value={form.duracaoMinutos} onChange={handleChange}>
              <option value={60}>1 hora {form.tipoContrato === "por_hora" ? "⭐ Recomendado" : ""}</option>
              <option value={120}>2 horas</option>
              <option value={240}>4 horas</option>
              <option value={480}>8 horas</option>
              <option value={720}>12 horas</option>
              <option value={1440}>24 horas</option>
              <option value={43200}>30 dias {form.tipoContrato === "mensalista" ? "⭐ Recomendado" : ""}</option>
            </select>
            {form.tipoContrato && (
              <small className={styles.duracaoHint}>
                {form.tipoContrato === "mensalista" && "💡 Mensalistas: Recomendado 30 dias"}
                {form.tipoContrato === "por_hora" && "💡 Por Hora: Recomendado 1 hora"}
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
              <div className={styles.fotoContainer}>
                <img src={previewFoto} alt="Foto 3x4" />
                <button 
                  type="button" 
                  className={styles.removerFoto} 
                  onClick={removerFoto}
                  title="Remover foto"
                >
                  ❌
                </button>
              </div>
            ) : (
              <div className={styles.fotoPlaceholder}>Foto 3x4</div>
            )}

            {/* Botão principal da foto */}
            <div className={styles.fotoButtonContainer}>
              <button 
                type="button"
                className={styles.fotoButton}
                onClick={() => setMostrarOpcoesFoto(!mostrarOpcoesFoto)}
              >
                📷 {previewFoto ? 'Alterar Foto' : 'Inserir Foto'}
              </button>

              {/* Menu de opções da foto */}
              {mostrarOpcoesFoto && (
                <div className={styles.fotoOptions}>
                  <button
                    type="button"
                    className={styles.fotoOptionBtn}
                    onClick={abrirCamera}
                  >
                    Tirar Foto
                  </button>
                  <button
                    type="button"
                    className={styles.fotoOptionBtn}
                    onClick={abrirGaleria}
                  >
                    Galeria
                  </button>
                </div>
              )}
            </div>

            {/* Input oculto para galeria */}
            <input
              id="foto-input-galeria"
              type="file"
              accept="image/*,image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Modal da câmera */}
          {mostrandoCamera && (
            <div className={styles.cameraModal}>
              <div className={styles.cameraContainer}>
                <div className={styles.cameraHeader}>
                  <h3>📷 Tirar Foto</h3>
                  <button
                    type="button"
                    className={styles.fecharCamera}
                    onClick={fecharCamera}
                  >
                    ❌
                  </button>
                </div>
                
                <div className={styles.cameraPreview}>
                  <video
                    id="camera-preview"
                    autoPlay
                    playsInline
                    muted
                    className={styles.videoPreview}
                  />
                </div>
                
                <div className={styles.cameraControls}>
                  <button
                    type="button"
                    className={styles.alternarCameraBtn}
                    onClick={alternarCamera}
                    title="Alternar câmera"
                  >
                    🔄
                  </button>
                  <button
                    type="button"
                    className={styles.tirarFotoBtn}
                    onClick={tirarFoto}
                  >
                    📸 Capturar
                  </button>
                  <button
                    type="button"
                    className={styles.cancelarCameraBtn}
                    onClick={fecharCamera}
                  >
                    ❌ Cancelar
                  </button>
                </div>
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

            <div className={styles.formRow}>
              <label>
                Tel/Cel:
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(99) 9 9999-9999"
                />
              </label>

              <label>
                E-mail:
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@exemplo.com"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label>
                Profissão:
                <input
                  type="text"
                  name="profissao"
                  value={form.profissao}
                  onChange={handleChange}
                  placeholder="Lojista"
                />
              </label>

              <label>
                Tipo de Contrato:
                <select name="tipoContrato" value={form.tipoContrato} onChange={handleChange}>
                  <option value="mensalista">Mensalista</option>
                  <option value="por_hora">Por Hora</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            {editandoId ? "Atualizar" : "Cadastrar"}
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
              <th>Vaga</th>
              <th>Hora Entrada</th>
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
                <td>{v.vaga}</td>
                <td>{v.horaEntrada}</td>
                <td>{v.dataEntrada}</td>
                <td className={v.duracaoMinutos === 43200 ? styles.duracaoMensal : ''}>
                  {calcularTempoPermitido(v.duracaoMinutos)}
                </td>
                <td className={obterClasseTempoDecorrido(v.dataEntrada, v.horaEntrada)}>
                  {calcularTempoDecorrido(v.dataEntrada, v.horaEntrada, v.tipoContrato)}
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

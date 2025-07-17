"use client";

import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
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
  whatsapp: string;
  profissao: string;
  tipoContrato: string;
  horaEntrada: string;
  dataEntrada: string;
  duracaoMinutos: number;
  fotoUrl: string;
}

export default function VehicleFormPage() {
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
    whatsapp: "",
    profissao: "",
    tipoContrato: "mensalista",
    horaEntrada: "",
    dataEntrada: "",
    duracaoMinutos: 15,
    fotoUrl: "",
  });

  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<VehicleData[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tempoAtual, setTempoAtual] = useState(new Date());
  const [sidebarAberta, setSidebarAberta] = useState(false);

  useEffect(() => {
    carregarDados();
    
    // Atualizar o tempo a cada minuto para recalcular os tempos decorridos
    const interval = setInterval(() => {
      setTempoAtual(new Date());
    }, 60000); // 60 segundos
    
    return () => {
      clearInterval(interval);
    };
  }, []);

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
        
        // Verificar se o clique foi dentro do sidebar ou no toggle
        if (sidebarElement && toggleElement && 
            !sidebarElement.contains(event.target as Node) && 
            !toggleElement.contains(event.target as Node)) {
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
      };
      reader.onerror = () => {
        alert('Erro ao carregar a imagem. Tente novamente.');
      };
      reader.readAsDataURL(file);
    }
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
      whatsapp: "",
      profissao: "",
      tipoContrato: "mensalista",
      horaEntrada: "",
      dataEntrada: "",
      duracaoMinutos: 15,
      fotoUrl: "",
    });
    setEditandoId(null);
    setPreviewFoto(null);
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const realizarBusca = (termo: string, fecharSidebar: boolean = false) => {
    const termoNormalizado = normalizarTexto(termo);
    
    // Carregar todos os dados do localStorage para buscar
    if (typeof window !== 'undefined') {
      const todosOsDados = JSON.parse(localStorage.getItem("veiculos") || "[]");
    
      if (!termoNormalizado) {
        setResultados(todosOsDados);
        // Apenas limpar o formulário se não há termo de busca, mas SEM limpar o campo de busca
        if (editandoId) {
          setEditandoId(null);
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
            whatsapp: "",
            profissao: "",
            tipoContrato: "mensalista",
            horaEntrada: "",
            dataEntrada: "",
            duracaoMinutos: 15,
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
          normalizarTexto(item.vaga).includes(termoNormalizado) ||
          normalizarTexto(item.documento).includes(termoNormalizado)
      );
    
      setResultados(filtrado);
    
      // Se encontrou resultados, carregar o primeiro no formulário para edição
      if (filtrado.length > 0) {
        const primeiroResultado = filtrado[0];
        setForm(primeiroResultado);
        setPreviewFoto(primeiroResultado.fotoUrl);
        setEditandoId(primeiroResultado.id);
      } else {
        // Se não encontrou resultados, mostrar alerta apenas quando acionado pelo botão
        if (fecharSidebar) {
          alert(`🔍 Nenhum resultado encontrado para: "${termo}"\n\nTente buscar por:\n• Nome do condutor\n• Placa do veículo\n• Modelo do veículo\n• Cor\n• Número da vaga\n• Documento`);
        }
      
        // Limpar formulário se estava editando, mas SEM limpar o campo de busca
        if (editandoId) {
          setEditandoId(null);
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
            whatsapp: "",
            profissao: "",
            tipoContrato: "mensalista",
            horaEntrada: "",
            dataEntrada: "",
            duracaoMinutos: 15,
            fotoUrl: "",
          });
          setPreviewFoto(null);
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
        whatsapp: "",
        profissao: "",
        tipoContrato: "mensalista",
        horaEntrada: "",
        dataEntrada: "",
        duracaoMinutos: 15,
        fotoUrl: "",
      });
      setPreviewFoto(null);
      
      // Limpar o input de arquivo
      const inputFile = document.getElementById('foto-input') as HTMLInputElement;
      if (inputFile) {
        inputFile.value = '';
      }
    }
  };

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoTermo = e.target.value;
    setBusca(novoTermo);
    
    // Realizar busca em tempo real
    realizarBusca(novoTermo);
  };

  // Função para carregar um resultado específico no formulário
  const carregarResultadoNoFormulario = (resultado: VehicleData) => {
    setForm(resultado);
    setPreviewFoto(resultado.fotoUrl);
    setEditandoId(resultado.id);
  };

  const handleEditar = (id: string) => {
    const encontrado = resultados.find((v) => v.id === id);
    if (encontrado) {
      setForm(encontrado);
      setPreviewFoto(encontrado.fotoUrl);
      setEditandoId(id);
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
          whatsapp: "",
          profissao: "",
          tipoContrato: "mensalista",
          horaEntrada: "",
          dataEntrada: "",
          duracaoMinutos: 15,
          fotoUrl: "",
        });
        setPreviewFoto(null);
        
        // Limpar o input de arquivo
        const inputFile = document.getElementById('foto-input') as HTMLInputElement;
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
  const calcularTempoExcedido = (dataEntrada: string, horaEntrada: string, duracaoMinutos: number) => {
    if (!dataEntrada || !horaEntrada) return "0 min";

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
    const agora = new Date();
    
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, não há tempo excedido
    if (diferencaMinutos < 0) {
      return "Entrada futura";
    }
    
    const tempoExcedido = diferencaMinutos - duracaoMinutos;
    
    if (tempoExcedido <= 0) {
      return "0 min";
    }
    
    // Para durações mensais (30 dias), mostrar em dias se excedeu
    if (duracaoMinutos === 43200 && tempoExcedido >= 1440) {
      const diasExcedidos = Math.floor(tempoExcedido / 1440);
      const horasRestantes = Math.floor((tempoExcedido % 1440) / 60);
      if (horasRestantes > 0) {
        return `${diasExcedidos}d ${horasRestantes}h`;
      } else {
        return `${diasExcedidos} dia${diasExcedidos > 1 ? 's' : ''}`;
      }
    }
    
    // Para outras durações, mostrar normalmente
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
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, usar classe especial
    if (diferencaMinutos < 0) {
      return styles.tempoFuturo || styles.tempoDecorrido;
    }
    
    return styles.tempoDecorrido;
  };

  // Função para obter a classe CSS baseada no tempo excedido
  const obterClasseTempoExcedido = (dataEntrada: string, horaEntrada: string, duracaoMinutos: number) => {
    if (!dataEntrada || !horaEntrada) return styles.tempoExcedido;

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se a entrada é futura, usar classe especial
    if (diferencaMinutos < 0) {
      return styles.tempoFuturo || styles.tempoExcedido;
    }
    
    const tempoExcedido = diferencaMinutos - duracaoMinutos;
    
    if (tempoExcedido <= 0) {
      return styles.tempoNormal;
    }
    
    // Para durações mensais, usar tolerâncias em dias
    if (duracaoMinutos === 43200) {
      const diasExcedidos = Math.floor(tempoExcedido / 1440);
      if (diasExcedidos <= 1) {
        return styles.tempoExcedidoLeve;
      } else if (diasExcedidos <= 3) {
        return styles.tempoExcedidoMedio;
      } else {
        return styles.tempoExcedidoGrave;
      }
    }
    
    // Para outras durações, usar tolerâncias em minutos/horas
    if (tempoExcedido <= 30) {
      return styles.tempoExcedidoLeve;
    } else if (tempoExcedido <= 60) {
      return styles.tempoExcedidoMedio;
    } else {
      return styles.tempoExcedidoGrave;
    }
  };

  // Função para calcular o tempo decorrido total
  const calcularTempoDecorrido = (dataEntrada: string, horaEntrada: string) => {
    if (!dataEntrada || !horaEntrada) return "0 min";

    const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
    const agora = new Date();
    
    const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    // Se o tempo é negativo (entrada futura), mostrar "Futuro"
    if (diferencaMinutos < 0) {
      const minutosPositivos = Math.abs(diferencaMinutos);
      if (minutosPositivos < 60) {
        return `Futuro (${minutosPositivos} min)`;
      } else if (minutosPositivos < 1440) {
        const horas = Math.floor(minutosPositivos / 60);
        const minutos = minutosPositivos % 60;
        return minutos > 0 ? `Futuro (${horas}h ${minutos}min)` : `Futuro (${horas}h)`;
      } else {
        const dias = Math.floor(minutosPositivos / 1440);
        const horas = Math.floor((minutosPositivos % 1440) / 60);
        if (horas > 0) {
          return `Futuro (${dias}d ${horas}h)`;
        } else {
          return `Futuro (${dias} dia${dias > 1 ? 's' : ''})`;
        }
      }
    }
    
    // Tempo normal (passado)
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
      whatsapp: "",
      profissao: "",
      tipoContrato: "mensalista",
      horaEntrada: "",
      dataEntrada: "",
      duracaoMinutos: 15,
      fotoUrl: "",
    });
    setPreviewFoto(null);
    setBusca("");
    carregarDados();
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input') as HTMLInputElement;
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
    
    // Limpar o input de arquivo
    const inputFile = document.getElementById('foto-input') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const exportarParaCSV = () => {
    if (resultados.length === 0) {
      alert("Não há dados para exportar!");
      return;
    }

    const cabecalho = [
      "Tipo", "Placa", "Modelo", "Cor", "Vaga", "Condutor", "Documento", 
      "Telefone", "WhatsApp", "Profissão", "Tipo Contrato", 
      "Data Entrada", "Hora Entrada", "Duração (min)", "Tempo Decorrido", "Tempo Excedido"
    ].join(",");

    const linhas = resultados.map(v => [
      `"${v.tipo}"`,
      `"${v.placa}"`,
      `"${v.modelo}"`,
      `"${v.cor}"`,
      `"${v.vaga}"`,
      `"${v.condutor}"`,
      `"${v.documento}"`,
      `"${v.telefone}"`,
      `"${v.whatsapp}"`,
      `"${v.profissao}"`,
      `"${v.tipoContrato}"`,
      `"${v.dataEntrada}"`,
      `"${v.horaEntrada}"`,
      v.duracaoMinutos,
      `"${calcularTempoDecorrido(v.dataEntrada, v.horaEntrada)}"`,
      `"${calcularTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos)}"`
    ].join(","));

    const csvContent = [cabecalho, ...linhas].join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `veiculos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Dados exportados com sucesso!\\n\\nArquivo: veiculos_${new Date().toISOString().split('T')[0]}.csv\\nTotal de registros: ${resultados.length}`);
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
          whatsapp: "",
          profissao: "",
          tipoContrato: "mensalista",
          horaEntrada: "",
          dataEntrada: "",
          duracaoMinutos: 15,
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
          <h2 className={styles.sidebarTitle}>🚗 Hotel Parking</h2>
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
              onClick={() => realizarBusca(busca, true)} 
              title="Buscar"
            >
              🔍
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
          <button onClick={exportarParaCSV} className={styles.actionButton} title="Exportar dados para CSV">
            📊 Exportar CSV
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
        {editandoId && (
          <div className={styles.editingIndicator}>
            ✏️ Editando veículo - Placa: <strong>{form.placa}</strong> | Condutor: <strong>{form.condutor}</strong>
          </div>
        )}
        
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

        <div className={styles.formRow}>
          <label>
            Hora Entrada:
            <input type="time" name="horaEntrada" value={form.horaEntrada} onChange={handleChange} />
          </label>

          <label>
            Data Entrada:
            <input type="date" name="dataEntrada" value={form.dataEntrada} onChange={handleChange} />
          </label>
        </div>

        <div className={styles.duracaoAgoraWrapper}>
          <label className={styles.duracaoLabel}>
            Duração:
            <select name="duracaoMinutos" value={form.duracaoMinutos} onChange={handleChange}>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={120}>2 horas</option>
              <option value={240}>4 horas</option>
              <option value={480}>8 horas</option>
              <option value={720}>12 horas</option>
              <option value={1440}>24 horas</option>
              <option value={43200}>30 dias (Mensal)</option>
            </select>
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
            <label className={styles.fotoButton}>
              📷 {previewFoto ? 'Alterar Foto' : 'Inserir Foto'}
              <input
                id="foto-input"
                type="file"
                accept="image/*,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFotoChange}
              />
            </label>
          </div>

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
                WhatsApp:
                <input
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="(99) 9 9999-9999"
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
                  <option value="diaria">Diária</option>
                  <option value="por_hora">Por Hora</option>
                  <option value="avulso">Avulso</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            {editandoId ? "Atualizar" : "Cadastrar"}
          </button>
          {editandoId && (
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
              <th>Tipo</th>
              <th>Condutor</th>
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
                <td>{v.tipo.charAt(0).toUpperCase() + v.tipo.slice(1)}</td>
                <td>{v.condutor}</td>
                <td className={styles.placaCell}>{exibirPlacaFormatada(v.placa)}</td>
                <td>{v.modelo}</td>
                <td>{v.cor}</td>
                <td>{v.vaga}</td>
                <td>{v.horaEntrada}</td>
                <td>{v.dataEntrada}</td>
                <td className={v.duracaoMinutos === 43200 ? styles.duracaoMensal : ''}>
                  {formatarDuracao(v.duracaoMinutos)}
                </td>
                <td className={obterClasseTempoDecorrido(v.dataEntrada, v.horaEntrada)}>
                  {calcularTempoDecorrido(v.dataEntrada, v.horaEntrada)}
                </td>
                <td className={obterClasseTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos)}>
                  {calcularTempoExcedido(v.dataEntrada, v.horaEntrada, v.duracaoMinutos)}
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

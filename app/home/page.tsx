"use client";

import React, { useState, useEffect } from "react";
import styles from "./Home.module.scss";

type VehicleType = "carro" | "moto";

interface VehicleData {
  id: string;
  tipo: VehicleType;
  placa: string;
  modelo: string;
  cor: string;
  vaga: string;
  condutor: string;
  documento: string;
  fotoUrl: string;
}

export default function VehicleFormPage() {
  const [form, setForm] = useState<VehicleData>({
    id: "",
    tipo: "carro",
    placa: "",
    modelo: "",
    cor: "",
    vaga: "",
    condutor: "",
    documento: "",
    fotoUrl: "",
  });

  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<VehicleData[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const data = JSON.parse(localStorage.getItem("veiculos") || "[]");
    setResultados(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, fotoUrl: reader.result as string }));
        setPreviewFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarDados = (dados: VehicleData[]) => {
    localStorage.setItem("veiculos", JSON.stringify(dados));
    setResultados(dados);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editandoId) {
      const atualizados = resultados.map((v) =>
        v.id === editandoId ? { ...form, id: editandoId } : v
      );
      salvarDados(atualizados);
      alert("Dados atualizados!");
    } else {
      const novo = { ...form, id: crypto.randomUUID() };
      salvarDados([...resultados, novo]);
      alert("Veículo cadastrado!");
    }

    setForm({
      id: "",
      tipo: "carro",
      placa: "",
      modelo: "",
      cor: "",
      vaga: "",
      condutor: "",
      documento: "",
      fotoUrl: "",
    });
    setEditandoId(null);
    setPreviewFoto(null);
  };

  const handleBusca = () => {
    const termo = busca.toLowerCase();
    if (!termo) {
      carregarDados();
      return;
    }
    const filtrado = resultados.filter(
      (item) =>
        item.condutor.toLowerCase().includes(termo) ||
        item.placa.toLowerCase().includes(termo)
    );
    setResultados(filtrado);
  };

  const limparBusca = () => {
    setBusca("");
    carregarDados();
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
    const confirm = window.confirm("Deseja excluir este registro?");
    if (confirm) {
      const atualizados = resultados.filter((v) => v.id !== id);
      salvarDados(atualizados);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Veículo</h1>

      <div className={styles.buscaWrapper}>
        <input
          type="text"
          placeholder="Buscar por condutor ou placa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleBusca();
            }
          }}
        />
        {busca && (
          <button className={styles.limparBtn} onClick={limparBusca} title="Limpar busca">
            ×
          </button>
        )}
        <button onClick={handleBusca}>🔍</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Tipo:
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="carro">Carro</option>
            <option value="moto">Moto</option>
          </select>
        </label>

        <label>
          Placa:
          <input type="text" name="placa" value={form.placa} onChange={handleChange} required />
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
          Nº da Vaga:
          <input type="text" name="vaga" value={form.vaga} onChange={handleChange} required />
        </label>

        <div className={styles.fotoNomeGrupo}>
          <div className={styles.fotoPreview}>
            {previewFoto ? (
              <img src={previewFoto} alt="Foto 3x4" />
            ) : (
              <div className={styles.fotoPlaceholder}>Foto 3x4</div>
            )}
            <label className={styles.fotoButton}>
              📷 Inserir Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
              />
            </label>
          </div>

          <div className={styles.nomeDocumento}>
            <label>
              Nome do Condutor:
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
        </div>

        <button type="submit">{editandoId ? "Atualizar" : "Cadastrar"}</button>
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
          <td>{v.placa}</td>
          <td>{v.modelo}</td>
          <td>{v.cor}</td>
          <td>{v.vaga}</td>
          <td>
            <button onClick={() => handleEditar(v.id)} title="Editar">✏️</button>
            <button onClick={() => handleExcluir(v.id)} title="Excluir">🗑️</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
</div>
  );
}

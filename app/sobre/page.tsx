"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaEnvelope } from "react-icons/fa";
import styles from "./Sobre.module.scss";

export default function Sobre() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={styles.appLayout}>
      {/* Toggle button para mobile */}
      <button 
        className={styles.sidebarToggle} 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay para mobile */}
      <div 
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.active : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
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
              onClick={closeSidebar}
            >
              <FaHome className={styles.navIcon} />
              <span>Início</span>
            </Link>
            <Link 
              href="/sobre" 
              className={`${styles.navLink} ${pathname === "/sobre" ? styles.activeNav : ""}`}
              onClick={closeSidebar}
            >
              <FaInfoCircle className={styles.navIcon} />
              <span>Sobre</span>
            </Link>
            <Link 
              href="/contato" 
              className={`${styles.navLink} ${pathname === "/contato" ? styles.activeNav : ""}`}
              onClick={closeSidebar}
            >
              <FaEnvelope className={styles.navIcon} />
              <span>Contato</span>
            </Link>
          </nav>
        </div>

        {/* Seção de ações na sidebar */}
        <div className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Ações</h3>
          <Link href="/home" className={styles.actionButton} onClick={closeSidebar}>
            Ir para Sistema
          </Link>
        </div>

        {/* Seção de estatísticas */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Estatísticas</h3>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🚗</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total de Veículos</span>
              <span className={styles.statNumber}>0</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⏰</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Tempo Médio</span>
              <span className={styles.statNumber}>0h</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>Sobre Nós</h1>
          <div className={styles.content}>
            <p>
              A <strong>ATI — Academia Técnica Interna</strong> nasceu com o
              propósito de transformar ideias em soluções digitais inteligentes e
              eficientes. Especializada no desenvolvimento de aplicações web
              modernas, nossa atuação é orientada por três pilares fundamentais:
              performance, acessibilidade e experiência do usuário.
            </p>
            <p>
              Trabalhamos com uma arquitetura modular baseada em Next.js e SCSS,
              proporcionando projetos escaláveis, organizados e prontos para
              integração com APIs, bancos de dados e tecnologias avançadas como
              Progressive Web Apps (PWA).
            </p>
            <p>
              Nosso compromisso é com a excelência técnica, a manutenibilidade do
              código e a entrega de valor real ao usuário final — sempre alinhados
              às melhores práticas do desenvolvimento contemporâneo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaEnvelope } from "react-icons/fa";
import styles from "./Contato.module.scss";

export default function Contato() {
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
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
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
              className={`${styles.navLink} ${pathname === '/home' ? styles.activeNav : ''}`}
              onClick={closeSidebar}
            >
              <FaHome className={styles.navIcon} />
              <span>Início</span>
            </Link>
            <Link 
              href="/sobre" 
              className={`${styles.navLink} ${pathname === '/sobre' ? styles.activeNav : ''}`}
              onClick={closeSidebar}
            >
              <FaInfoCircle className={styles.navIcon} />
              <span>Sobre</span>
            </Link>
            <Link 
              href="/contato" 
              className={`${styles.navLink} ${pathname === '/contato' ? styles.activeNav : ''}`}
              onClick={closeSidebar}
            >
              <FaEnvelope className={styles.navIcon} />
              <span>Contato</span>
            </Link>
          </nav>
        </div>

        {/* Seção de ações */}
        <div className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Ações</h3>
          <Link href="/home" className={styles.actionButton} onClick={closeSidebar}>
            Ir para Sistema
          </Link>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>Contato</h1>
          <p className={styles.subtitle}>Entre em contato conosco.</p>

          <form className={styles.form}>
            <label>
              Nome
              <input type="text" name="nome" required placeholder="Seu nome" />
            </label>

            <label>
              E-mail
              <input
                type="email"
                name="email"
                required
                placeholder="Seu e-mail"
              />
            </label>

            <label>
              Mensagem
              <textarea
                name="mensagem"
                rows={5}
                required
                placeholder="Digite sua mensagem"
              ></textarea>
            </label>

            <button type="submit">Enviar</button>
          </form>
        </div>
      </main>
    </div>
  );
}

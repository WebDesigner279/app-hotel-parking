"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaEnvelope } from "react-icons/fa";
import styles from "./Sidebar.module.scss";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const menuItems = [
    {
      href: "/",
      label: "Início",
      icon: FaHome,
    },
    {
      href: "/sobre",
      label: "Sobre",
      icon: FaInfoCircle,
    },
    {
      href: "/contato",
      label: "Contato",
      icon: FaEnvelope,
    },
  ];

  return (
    <>
      {/* Botão para abrir/fechar sidebar */}
      <button
        className={styles.menuToggle}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay para fechar sidebar ao clicar fora */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Logo no topo do sidebar */}
        <div className={styles.logo}>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className={styles.logoImage}
          />
          <div className={styles.empresa}>
            <span className={styles.empresaNome}>ATI</span>
            <span className={styles.slogan}>Academia Técnica Interna</span>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href} className={styles.navItem}>
                  <Link
                    href={item.href}
                    className={`${styles.link} ${isActive ? styles.active : ""}`}
                    onClick={closeSidebar}
                  >
                    <IconComponent className={styles.icon} />
                    <span className={styles.linkText}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

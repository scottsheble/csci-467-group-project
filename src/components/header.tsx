import styles from "@/styles/header.module.css";
import Link from "next/link";

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.headerLeft}>
                    <Link href="/">
                        <img src={undefined}
                        alt="Our Logo - todo!();" className={styles.headerLogo} />
                    </Link>
                    <span className="header-title">Our Name - todo!();</span>
                </div>
                <nav className="header-nav">
                    <Link href="/about">About</Link>
                    <Link href="/contact">Contact</Link>
                </nav>
            </div>
        </header>
    );
}
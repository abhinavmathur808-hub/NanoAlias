import { Linkedin, Github, Mail } from "lucide-react";

const socialLinks = [
    {
        href: "https://www.linkedin.com/in/abhinav-mathur-669414356",
        icon: Linkedin,
        label: "LinkedIn",
    },
    {
        href: "https://github.com/abhinavmathur808-hub",
        icon: Github,
        label: "GitHub",
    },
    {
        href: "mailto:abhinavmathur808@gmail.com",
        icon: Mail,
        label: "Email",
    },
];

export default function Footer() {
    return (
        <footer className="footer">
            <span className="footer-copy">
                &copy; 2026 NanoAlias. Built by Abhinav Mathur.
            </span>

            <div className="footer-socials">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                        key={label}
                        href={href}
                        aria-label={label}
                        target={href.startsWith("mailto:") ? undefined : "_blank"}
                        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                        className="footer-icon"
                    >
                        <Icon size={18} strokeWidth={1.5} />
                    </a>
                ))}
            </div>

            <style>{`
                .footer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 24px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.45);
                }

                .footer-copy {
                    letter-spacing: 0.3px;
                }

                .footer-socials {
                    display: flex;
                    gap: 16px;
                }

                .footer-icon {
                    color: rgba(255, 255, 255, 0.45);
                    text-decoration: none;
                    transition: color 0.3s ease, filter 0.3s ease;
                }

                .footer-icon:hover {
                    color: #CEB372;
                    filter: drop-shadow(0 0 6px rgba(206, 179, 114, 0.5));
                }
            `}</style>
        </footer>
    );
}

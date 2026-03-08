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
        <footer className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full z-50">
            <span className="text-sm text-gray-400 whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Built by Abhinav
            </span>

            <div className="w-px h-4 bg-white/20" />

            <div className="flex items-center gap-3">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                        key={label}
                        href={href}
                        aria-label={label}
                        target={href.startsWith("mailto:") ? undefined : "_blank"}
                        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                        className="footer-icon"
                    >
                        <Icon size={16} strokeWidth={1.5} />
                    </a>
                ))}
            </div>

            <style>{`
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

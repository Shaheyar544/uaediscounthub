"use client"

import { Twitter, Linkedin, Instagram, MessageCircle } from 'lucide-react'
import { useHasMounted } from '@/hooks/use-has-mounted'

export function SocialButtons() {
    const hasMounted = useHasMounted()
    return (
        <div className="footer-socials flex gap-2 mt-1">
            {[
                { icon: <Twitter className="w-3.5 h-3.5" />, label: 'X' },
                { icon: <Linkedin className="w-3.5 h-3.5" />, label: 'LinkedIn' },
                { icon: <Instagram className="w-3.5 h-3.5" />, label: 'Instagram' },
                { icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'WhatsApp' }
            ].map((s, i) => (
                <button
                    key={i}
                    className={`footer-social-btn w-[34px] h-[34px] border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all ${!hasMounted ? 'invisible' : 'visible'}`}
                >                                    
                    {s.icon}
                </button>
            ))}
        </div>
    )
}

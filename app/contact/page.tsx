"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  ExternalLink,
  Send,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

const contacts = [
  {
    name: "WhatsApp",
    icon: MessageCircle,
    href: "https://wa.me/2349036826272",
    description: "Chat with us directly",
    color: "bg-green-500",
    hoverColor: "hover:border-green-500",
  },
  {
    name: "Phone",
    icon: Phone,
    href: "tel:+2349036826272",
    description: "Call us anytime",
    color: "bg-blue-500",
    hoverColor: "hover:border-blue-500",
  },
  {
    name: "Email",
    icon: Mail,
    href: "mailto:decoder.ng@gmail.com",
    description: "decoder.ng@gmail.com",
    color: "bg-orange-500",
    hoverColor: "hover:border-orange-500",
  },
  {
    name: "X (Twitter)",
    icon: Twitter,
    href: "https://twitter.com/decode",
    description: "@decode",
    color: "bg-neutral-700",
    hoverColor: "hover:border-neutral-500",
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://facebook.com/decode",
    description: "Follow our page",
    color: "bg-blue-600",
    hoverColor: "hover:border-blue-600",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/kingtechfoundation/decode",
    description: "Professional network",
    color: "bg-blue-700",
    hoverColor: "hover:border-blue-700",
  },
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com/decode",
    description: "@decode",
    color: "bg-linear-to-br from-purple-500 via-pink-500 to-orange-500",
    hoverColor: "hover:border-pink-500",
  },
  {
    name: "TikTok",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
    href: "https://tiktok.com/@decode",
    description: "@decode",
    color: "bg-neutral-900",
    hoverColor: "hover:border-neutral-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link with form data
      const mailtoLink = `mailto:decoder.ng@gmail.com?subject=${encodeURIComponent(
        formData.subject || `Message from ${formData.name}`
      )}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      )}`;

      // Open email client
      window.location.href = mailtoLink;

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header with Logo and Theme Toggle */}
      <PageHeader
        title="Contact Us"
        subtitle="Reach out through your preferred channel"
      />

      {/* Contact Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {contacts.map((contact) => {
          const Icon = contact.icon;
          return (
            <motion.a
              key={contact.name}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              className={cn(
                "glass rounded-xl p-4 space-y-3 border border-transparent transition-all duration-300",
                contact.hoverColor
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                  contact.color
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-semibold text-white">
                    {contact.name}
                  </h3>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {contact.description}
                </p>
              </div>
            </motion.a>
          );
        })}
      </motion.div>

      {/* Quick Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-5 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-500 rounded-full" />
          Send Us a Message
        </h2>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-sm text-green-400">
              Your email client has been opened with the message!
            </p>
          </motion.div>
        )}
        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">
              Something went wrong. Please try again.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Email - Side by side on desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Doe"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@example.com"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Subject (Optional)
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="What's this about?"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Your Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Tell us how we can help you..."
              required
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.name ||
              !formData.email ||
              !formData.message
            }
            className="w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/25"
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Opening Email...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Message
              </>
            )}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 text-sm pt-2 border-t border-neutral-800">
          <span className="flex items-center gap-2 text-neutral-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Usually responds within 24h
          </span>
        </div>
      </motion.div>
    </div>
  );
}

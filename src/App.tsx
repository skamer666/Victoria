import React, { useState, useEffect } from 'react'

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface ServiceCard {
  title: string
  description: string
  duration: string
  price: string
}

interface ModuleCard {
  id: string
  title: string
  oracle: string
  description: string
  duration: string
  oldPrice: string
  promoPrice: string
  content: string[]
}

export default function App() {
  // Navigation active link tracking
  const [activeSection, setActiveSection] = useState('accueil')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Booking form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [requestType, setRequestType] = useState('guidance')
  const [selectedModule, setSelectedModule] = useState('aucun')
  const [selectedGuidanceType, setSelectedGuidanceType] = useState('lumiere')
  const [timeSlot, setTimeSlot] = useState('')
  const [message, setMessage] = useState('')
  
  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activePopup, setActivePopup] = useState<'success' | 'error' | 'simulation-choice' | null>(null)
  // Testimonials loaded from external JSON file
  const [testimonials, setTestimonials] = useState<{author: string, text: string}[]>([])
  
  // Dynamically load Google reCAPTCHA Enterprise script if configured
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
    if (siteKey && siteKey !== 'YOUR_RECAPTCHA_SITE_KEY') {
      if (!document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    }
  }, [])

  // Disable right-click and drag-and-drop on all image elements
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        e.preventDefault()
      }
    }
    
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  useEffect(() => {
    fetch('/data/temoignages.json')
      .then(r => r.json())
      .then(data => setTestimonials(data))
      .catch(() => setTestimonials([]))
  }, [])



  // IntersectionObserver for Scroll-Triggered Animations and Active Nav Link
  useEffect(() => {
    // 1. Scroll-trigger reveal animation observer
    const revealElements = document.querySelectorAll('.reveal-on-scroll')
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    revealElements.forEach((el) => revealObserver.observe(el))

    // 2. Scroll watcher for header shadow/blur and active section tracking
    const handleScroll = () => {
      // Backdrop shadow/blur scroll check
      setIsScrolled(window.scrollY > 20)

      // Active section tracking
      const sections = ['accueil', 'guidances', 'oracles', 'bienfaits', 'mon-oracle-c', 'bio', 'formations', 'horaires', 'reservation', 'temoignages', 'contact']
      let currentSection = 'accueil'
      let minDiff = Infinity

      sections.forEach((id) => {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // Check if the section is in the upper viewport portion
          if (rect.top < window.innerHeight * 0.4 && rect.bottom > 120) {
            const diff = Math.abs(rect.top - 100)
            if (diff < minDiff) {
              minDiff = diff
              currentSection = id
            }
          }
        }
      })

      if (currentSection === 'bienfaits') {
        currentSection = 'oracles'
      }
      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Run once on mount

    return () => {
      revealObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Smooth scroll to element helper with header offset
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 90
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Pre-select module and scroll to booking form
  const handleBookModule = (moduleId: string) => {
    setRequestType('formation')
    setSelectedModule(moduleId)
    scrollTo('reservation')
  }

  // Pre-select guidance and scroll to booking form
  const handleBookGuidance = (title: string) => {
    setRequestType('guidance')
    if (title === 'Guidance Lumière') {
      setSelectedGuidanceType('lumiere')
    } else if (title === 'Guidance Complète') {
      setSelectedGuidanceType('complete')
    } else if (title === 'Guidance Signature') {
      setSelectedGuidanceType('signature')
    }
    scrollTo('reservation')
  }

  // Form Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID'
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID'
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY'

    // If placeholders are still present, open simulation choice
    if (serviceId === 'YOUR_SERVICE_ID' || templateId === 'YOUR_TEMPLATE_ID' || publicKey === 'YOUR_PUBLIC_KEY') {
      setIsSubmitting(false)
      setActivePopup('simulation-choice')
      return
    }

    setIsSubmitting(true)

    // Execute reCAPTCHA Enterprise programmatically to get token
    let token = ''
    if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_SITE_KEY' && window.grecaptcha?.enterprise) {
      try {
        token = await new Promise<string>((resolve, reject) => {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const resToken = await window.grecaptcha.enterprise.execute(recaptchaSiteKey, { action: 'submit' })
              resolve(resToken)
            } catch (err) {
              reject(err)
            }
          })
        })
      } catch (err) {
        console.error("reCAPTCHA Enterprise execution failed:", err)
        alert("La validation de sécurité (reCAPTCHA) a échoué. Veuillez réessayer.")
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            firstName,
            lastName,
            email,
            phone,
            requestType: requestType === 'guidance' 
              ? 'Guidance' 
              : requestType === 'formation' 
                ? 'Formation' 
                : 'Informations sur l\'Oracle C',
            selectedModule: requestType === 'formation' ? selectedModule : 'N/A',
            selectedGuidanceType: requestType === 'guidance' ? selectedGuidanceType : 'N/A',
            timeSlot: requestType === 'guidance' ? timeSlot : 'N/A',
            message: message || '(Aucun message)',
            ...(token ? { 'g-recaptcha-response': token } : {})
          }
        })
      })

      if (response.ok) {
        // Reset form
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setSelectedGuidanceType('lumiere')
        setTimeSlot('')
        setMessage('')
        setActivePopup('success')
      } else {
        const errText = await response.text()
        console.error("EmailJS Error Response:", errText)
        alert("Détails de l'erreur : " + errText)
        setActivePopup('error')
      }
    } catch (error: any) {
      console.error("Network Error:", error)
      alert("Erreur de réseau : " + error?.message)
      setActivePopup('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const services: ServiceCard[] = [
    {
      title: "Guidance Lumière",
      description: "Une guidance courte et ciblée, idéale si tu as une question précise ou besoin d’un éclairage sur une situation du moment.",
      duration: "30 min",
      price: "35€"
    },
    {
      title: "Guidance Complète",
      description: "Une guidance approfondie, pensée pour prendre le temps d’explorer une situation avec attention et justesse. Cette séance invite à décoder les messages reçus, à mettre en lumière les blocages, les émotions ou les choix qui se présentent à toi. Grâce à un tirage détaillé, tu repars avec une vision clarifiée, apaisée et alignée.",
      duration: "60 min",
      price: "60€"
    },
    {
      title: "Guidance Signature",
      description: "Une guidance complète et plus interactive, qui inclut également un temps de questions-réponses de 15 minutes pour revenir sur les messages reçus, clarifier certains points et t’aider à repartir avec une compréhension plus claire. Idéale si tu as besoin de réponses précises sur des thèmes spécifiques.",
      duration: "75 min",
      price: "80€"
    }
  ]

  const modules: ModuleCard[] = [
    {
      id: "module-1",
      title: "Module 1",
      oracle: "Comprendre & maîtriser l’Oracle GE",
      description: "Acquérir les bases indispensables pour lire et décoder l'Oracle GE avec précision.",
      duration: "6h — 3 séances de 2h",
      oldPrice: "420€",
      promoPrice: "360€",
      content: [
        "Étude des symboles et des lames clés",
        "Structure de base du tirage de l'Oracle GE",
        "Pratiques guidées en petit groupe",
        "Support de cours complet inclus"
      ]
    },
    {
      id: "module-2",
      title: "Module 2",
      oracle: "Comprendre, maîtriser & interpréter l’Oracle C + GE",
      description: "Acquérir les bases essentielles pour comprendre les lames, interpréter les messages des cartes et construire des synthèses de lecture claires, que ce soit avec l’Oracle C ou l’Oracle GE.",
      duration: "8h — 4 séances de 2h",
      oldPrice: "580€",
      promoPrice: "480€",
      content: [
        "Découverte des lames, des symboles et de leur langage",
        "Méthode pour interpréter une guidance avec justesse",
        "Apprentissage de la synthèse de lecture",
        "Pratiques guidées sur l’Oracle C et/ou l’Oracle GE",
        "Support de cours complet inclus"
      ]
    },
    {
      id: "module-3",
      title: "Module 3",
      oracle: "Maîtriser la lecture complète + synthèse Oracles C, GE et Miroirs",
      description: "Le module le plus complet pour développer une lecture polyvalente, gagner en aisance dans différentes situations de guidance et apprendre à structurer une interprétation claire, cohérente et adaptée à chaque situation.",
      duration: "12h — 6 séances de 2h",
      oldPrice: "880€",
      promoPrice: "720€",
      content: [
        "Utilisation des Oracles C, GE et Miroirs selon les besoins de la guidance",
        "Adaptation de la lecture à différents types de questions et de situations",
        "Développement d’une interprétation plus fluide, précise et nuancée",
        "Méthode pour structurer une guidance du début à la fin",
        "Construction d’une synthèse claire, utile et personnalisée",
        "Mises en situation réelles et pratiques accompagnées",
        "Posture de guidance, écoute et accompagnement de la personne"
      ]
    }
  ]

  return (
    <div className="relative bg-white text-brand-black min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-gold selection:text-black">
      
      {/* Decorative Golden Top Line */}
      <div className="h-1.5 w-full bg-gold fixed top-0 left-0 z-50" />

      {/* Header & Translucent Sticky Navigation */}
      <header className={`fixed top-1.5 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-md py-3 border-b border-gold/30' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-[1440px] mx-auto px-6 xl:px-12 flex justify-between items-center w-full">
          
          {/* Logo / Brand Name */}
          <div 
            onClick={() => scrollTo('accueil')} 
            className="flex flex-col cursor-pointer group"
          >
            <img 
              src="/assets/logo_isolated.png" 
              alt="Logo Cabinet Victoria" 
              className="h-8 md:h-10 w-auto object-contain transition-opacity group-hover:opacity-80 mb-0.5"
            />
            <span className="text-[9px] uppercase tracking-[0.22em] text-gold font-bold -mt-0.5 block whitespace-nowrap">
              Guidances & Formations
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[11px] xl:text-xs font-semibold uppercase tracking-wider lg:ml-6 lg:mr-6 xl:ml-10 xl:mr-10">
            <a 
              href="#accueil"
              onClick={(e) => { e.preventDefault(); scrollTo('accueil'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'accueil' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Accueil
            </a>
            <a 
              href="#guidances"
              onClick={(e) => { e.preventDefault(); scrollTo('guidances'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'guidances' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Guidances
            </a>
            <a 
              href="#oracles"
              onClick={(e) => { e.preventDefault(); scrollTo('oracles'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'oracles' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Les Oracles
            </a>
            <a 
              href="#mon-oracle-c"
              onClick={(e) => { e.preventDefault(); scrollTo('mon-oracle-c'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'mon-oracle-c' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Mon Oracle C
            </a>
            <a 
              href="#bio"
              onClick={(e) => { e.preventDefault(); scrollTo('bio'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'bio' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Ma bio
            </a>
            <a 
              href="#formations"
              onClick={(e) => { e.preventDefault(); scrollTo('formations'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'formations' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Formations
            </a>
            <a 
              href="#horaires"
              onClick={(e) => { e.preventDefault(); scrollTo('horaires'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'horaires' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Horaires
            </a>
            <a 
              href="#reservation"
              onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'reservation' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Réserver
            </a>
            <a 
              href="#temoignages"
              onClick={(e) => { e.preventDefault(); scrollTo('temoignages'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'temoignages' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Témoignages
            </a>
            <a 
              href="#contact"
              onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}
              className={`hover:text-brand-red transition-colors relative py-1 whitespace-nowrap ${
                activeSection === 'contact' ? 'text-brand-red border-b border-brand-red' : 'text-gold'
              }`}
            >
              Contact
            </a>
          </nav>
 
          {/* Booking CTA Button (Desktop) */}
          <div className="hidden lg:block">
            <a 
              href="#reservation"
              onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
              className="inline-block px-5 py-2 border border-gold text-xs uppercase tracking-widest font-semibold hover:bg-brand-black hover:text-white hover:border-brand-black transition-all duration-300 whitespace-nowrap"
            >
              Prendre RDV
            </a>
          </div>
 
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-brand-black focus:outline-none"
            aria-label="Toggle Menu"
          >
            <div className="space-y-1.5 w-6">
              <span className={`block h-0.5 bg-brand-black transition-transform duration-300 ${mobileMenuOpen ? 'transform rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-brand-black transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`block h-0.5 bg-brand-black transition-transform duration-300 ${mobileMenuOpen ? 'transform -rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
 
        </div>
      </header>
 
      {/* Mobile Drawer Menu */}
      <div className={`fixed inset-0 bg-brand-black/95 z-30 transition-transform duration-500 ease-in-out transform ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:hidden flex flex-col justify-center items-center`}>
        <nav className="flex flex-col gap-6 text-lg uppercase tracking-widest text-center">
          <a 
            href="#accueil"
            onClick={(e) => { e.preventDefault(); scrollTo('accueil'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'accueil' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Accueil
          </a>
          <a 
            href="#guidances"
            onClick={(e) => { e.preventDefault(); scrollTo('guidances'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'guidances' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Guidances par les Oracles
          </a>
          <a 
            href="#oracles"
            onClick={(e) => { e.preventDefault(); scrollTo('oracles'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'oracles' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Les Oracles
          </a>
          <a 
            href="#mon-oracle-c"
            onClick={(e) => { e.preventDefault(); scrollTo('mon-oracle-c'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'mon-oracle-c' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Mon Oracle C
          </a>
          <a 
            href="#bio"
            onClick={(e) => { e.preventDefault(); scrollTo('bio'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'bio' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Ma bio
          </a>
          <a 
            href="#formations"
            onClick={(e) => { e.preventDefault(); scrollTo('formations'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'formations' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Formations
          </a>
          <a 
            href="#horaires"
            onClick={(e) => { e.preventDefault(); scrollTo('horaires'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'horaires' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Horaires &amp; Tarifs
          </a>
          <a 
            href="#reservation"
            onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'reservation' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Réserver
          </a>
          <a 
            href="#temoignages"
            onClick={(e) => { e.preventDefault(); scrollTo('temoignages'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'temoignages' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Témoignages
          </a>
          <a 
            href="#contact"
            onClick={(e) => { e.preventDefault(); scrollTo('contact'); }} 
            className={`transition-colors py-2 font-serif ${
              activeSection === 'contact' ? 'text-brand-red underline' : 'text-gold'
            }`}
          >
            Contact
          </a>
        </nav>
        <a 
          href="#reservation"
          onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
          className="mt-12 px-8 py-3 bg-gold text-brand-black uppercase font-bold tracking-widest hover:bg-white hover:text-brand-black transition-all text-center"
        >
          Réserver ma place
        </a>
      </div>

      {/* 1. Hero Section */}
      <section 
        id="accueil" 
        className="pt-24 md:pt-32 pb-16 md:pb-24 bg-slate-50 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative z-10 w-full">
          
          {/* Left Column: Heading and badging */}
          <div className="md:col-span-7 space-y-6 md:space-y-8 text-left">
            
            {/* Main Headlines */}
            <div className="space-y-4 animate-fade-up">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Accueil</span>
              <h1 className="text-3xl sm:text-4xl md:text-4xl font-light tracking-tight leading-[1.15] text-brand-black">
                Guidance intuitive <br />
                <span className="font-serif italic font-normal text-gold">et formation aux Oracles à Wavre</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 font-light max-w-xl leading-relaxed">
                Consultations individuelles et cycles d'apprentissage pour comprendre, maîtriser et interpréter les messages des cartes avec confiance.
              </p>
              <p className="text-sm text-slate-500 font-light max-w-xl leading-relaxed pt-2">
                Le Cabinet Victoria vous accompagne à travers des séances de guidance intuitive afin de vous aider à clarifier votre chemin, grâce à une lecture personnalisée des Oracles. Vous avez également la possibilité de suivre des formations aux Oracles en petits groupes, afin d’apprendre à comprendre et à interpréter les messages des cartes avec confiance.
              </p>
            </div>



            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="#reservation"
                onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
                className="px-8 py-4 bg-brand-black text-white hover:bg-gold hover:text-brand-black text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-brand-black/10 text-center"
              >
                Réserver une séance de guidance
              </a>
              <a 
                href="#reservation"
                onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
                className="px-8 py-4 border border-brand-black text-brand-black hover:bg-slate-100 text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center"
              >
                Réserver une formation
              </a>
            </div>

            {/* Social media links in hero */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm text-slate-600 font-light font-sans">
                Retrouvez-moi sur vos réseaux sociaux favoris.
              </span>
              <div className="flex items-center gap-6 text-slate-500">
                <a href="https://www.facebook.com/search/top?q=victoria%20guidances%20intuitives" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors duration-300">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/victoria_guidancesintuitives/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gold transition-colors duration-300">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.tiktok.com/@victoria.guidancesintuit" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-gold transition-colors duration-300">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Editorial Images & Overlapping badge */}
          <div className="md:col-span-5 relative flex justify-center items-center">
            
            {/* Visual Frame */}
            <div className="relative w-full max-w-[360px] md:max-w-none aspect-[4/5] bg-slate-200 border border-gold/40 shadow-2xl overflow-hidden rounded-2xl animate-fade-in">
              <img 
                src="/assets/victoria-portrait.jpg" 
                alt="Victoria guidance intuitive" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              
              {/* Overlay dark gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>


            {/* Overlapping small card */}
            <div className="absolute -top-6 -right-6 w-36 aspect-square hidden md:block bg-white p-2 border border-gold/30 shadow-lg rounded-xl transform rotate-6 z-10">
              <div className="w-full h-full rounded-lg overflow-hidden bg-slate-100">
                <img 
                  src="/assets/oracle_cards_detail.png" 
                  alt="Cartes d’Oracles utilisées pour une séance de guidance intuitive" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 2. Motto / Intro Section */}
      <section 
        id="intro" 
        className="py-14 md:py-16 bg-white relative z-10"
      >
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10 reveal-on-scroll">
          <div className="flex justify-center mb-2">
            <img 
              src="/assets/logo_isolated.png" 
              alt="Victoria" 
              className="h-10 md:h-12 w-auto object-contain opacity-95"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight text-brand-black">
            L'oracle ou le tarot ?
          </h2>

          <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-light max-w-3xl mx-auto space-y-6 text-left sm:text-justify font-sans">
            <p>
              Lorsqu'on aborde le monde de la cartomancie, la question de l'outil se pose naturellement. Pourquoi ai-je choisi de travailler spécifiquement avec les oracles plutôt qu'avec le tarot traditionnel ?
            </p>
            <p>
              Pour bien comprendre ce choix, il est utile de résumer simplement la différence entre ces deux pratiques sur le plan de la divination :
            </p>
            <div className="space-y-4 my-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-100/80 text-left">
              <p>
                <strong className="font-semibold text-brand-black">Le Tarot (L'analyse en profondeur) :</strong> C'est un outil plus technique et psychologique. Grâce à ses 78 cartes très codifiées, le tarot permet d'analyser en profondeur les causes complexes d'une situation, de sonder la psychologie des personnes impliquées et d'étudier l'évolution d'un problème sur le long terme.
              </p>
              <p>
                <strong className="font-semibold text-brand-black">L'Oracle (L'action et la clarté) :</strong> Il offre une approche beaucoup plus directe et pratique. Avec ses messages souvent limpides et thématiques, l'oracle va droit au but. Il est parfait pour délivrer un conseil immédiat, dégager une tendance claire ou apporter une réponse rapide et intuitive à une question précise.
              </p>
            </div>
            <div className="pt-2 text-left space-y-4">
              <p>
                Voilà pourquoi j’ai choisi l'oracle plutôt que le tarot.
              </p>
              <p>
                Mon objectif fondamental en tant que praticienne est de vous aider. Lorsque vous venez vers moi en quête de réponses ou d'éclaircissements, vous avez généralement besoin d'y voir clair rapidement pour pouvoir avancer sereinement.
              </p>
              <p>
                L'oracle me permet de vous offrir des guidances accessibles, concrètes et sans détours. Il me donne la possibilité de mettre en lumière ce qui est important dans l'instant présent, afin de vous transmettre les messages dont vous avez besoin pour retrouver confiance et clarté sur votre chemin.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold block mb-4">Mon Credo</span>
            <div className="inline-flex flex-wrap justify-center items-center gap-4 text-xs font-semibold uppercase tracking-widest text-slate-800 bg-slate-50 border border-slate-100 px-6 py-3 rounded-full">
              <span>Découvrir</span>
              <span className="text-gold">•</span>
              <span>Comprendre</span>
              <span className="text-gold">•</span>
              <span>Ressentir</span>
              <span className="text-gold">•</span>
              <span>Interpréter</span>
            </div>
          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 3. Guidance / Consultation Section */}
      <section 
        id="guidances" 
        className="py-14 md:py-16 bg-slate-100 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Header info */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Guidances</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">Guidances par les Oracles</h2>
            <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
              Une séance de guidance t’aide à poser un regard plus clair sur une situation, une question ou une étape de vie. Les Oracles permettent d’éclairer les blocages, les opportunités et les pistes d’évolution, avec douceur et précision.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 reveal-on-scroll delay-100">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group bg-white border border-slate-200/80 hover:border-gold p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1"
              >
                <div>
                  {/* Decorative Icon Hook */}
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-gold font-serif text-3xl">0{index + 1}.</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                      {service.duration}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-brand-black mb-3 group-hover:text-gold transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-light whitespace-pre-line font-sans">
                    {service.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
                  <span className="text-xl font-serif font-bold text-brand-black">{service.price}</span>
                  <button 
                    onClick={() => handleBookGuidance(service.title)}
                    className="text-xs uppercase tracking-widest font-semibold text-brand-red group-hover:text-brand-black transition-colors"
                  >
                    Réserver →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Link */}
          <div className="text-center reveal-on-scroll delay-200">
            <a 
              href="#reservation"
              onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-black hover:bg-gold hover:text-brand-black text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center"
            >
              Réserver une séance de guidance
            </a>
          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* Les Oracles Section */}
      <section 
        id="oracles" 
        className="py-14 md:py-16 bg-white relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Les Oracles</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">Mes trois supports de guidance</h2>
            <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
              Ces trois Oracles complémentaires constituent le fondement de mes consultations ainsi que de mes programmes de formation.
            </p>
          </div>

          {/* Oracles grid */}
          <div className="grid md:grid-cols-3 gap-8 items-stretch reveal-on-scroll delay-100">
            
            {/* Oracle C */}
            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-2xl flex flex-col justify-between hover:border-gold hover:bg-white transition-all duration-300 shadow-sm">
              <div>
                <div className="aspect-[3/4] w-full rounded-xl overflow-hidden mb-6 bg-slate-100/50">
                  <img 
                    src="/assets/oracle_c_box.jpg" 
                    alt="L’Oracle C utilisé dans les guidances du Cabinet Victoria" 
                    className="w-full h-full object-contain feather-edges"
                  />
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-1">L'Oracle C</h3>
                <span className="text-xs text-gold-dark font-bold uppercase tracking-wider block mb-4">Par Cathy Fabrizzi</span>
                <p className="text-slate-650 text-sm font-light leading-relaxed mb-6">
                  Ce jeu, qui a éveillé mon don de lecture intuitive, est devenu au fil du temps le pilier de mes guidances. Je l’ai revisité avec des symboles simples et évocateurs afin d’en faciliter la lecture et de le rendre accessible à tous. À la fois puissant et facile à utiliser, il accompagne chaque personne avec un éclairage précieux lorsqu’elle en a besoin.
                </p>
              </div>
            </div>

            {/* Oracle GE */}
            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-2xl flex flex-col justify-between hover:border-gold hover:bg-white transition-all duration-300 shadow-sm">
              <div>
                <div className="aspect-[3/4] w-full rounded-xl overflow-hidden mb-6 bg-slate-100/50">
                  <img 
                    src="/assets/oracle_ge.jpg" 
                    alt="L’Oracle GE utilisé pour apprendre la lecture intuitive des cartes" 
                    className="w-full h-full object-contain feather-edges"
                  />
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-1">L'Oracle GE</h3>
                <span className="text-xs text-gold-dark font-bold uppercase tracking-wider block mb-4">Par Gérard Barbier</span>
                <p className="text-slate-650 text-sm font-light leading-relaxed mb-6">
                  L’Oracle Gé se compose de 61 cartes. Les symboles utilisés dans ce jeu sont simples et facilement assimilables par tous, aussi bien par les néophytes que par les professionnels. L’originalité de cet Oracle réside notamment dans quatre lames qui permettent de dater les prédictions. Ce jeu est idéal pour les débutants, mais convient également parfaitement aux professionnels. Sa simplicité, alliée à votre intuition, vous permettra d’obtenir rapidement d’excellents résultats, même si vous débutez.
                </p>
              </div>
            </div>

            {/* Oracle des Miroirs */}
            <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-2xl flex flex-col justify-between hover:border-gold hover:bg-white transition-all duration-300 shadow-sm">
              <div>
                <div className="aspect-[3/4] w-full rounded-xl overflow-hidden mb-6 bg-slate-100/50">
                  <img 
                    src="/assets/oracle_miroirs.jpg" 
                    alt="L’Oracle des Miroirs pour la guidance et l’introspection" 
                    className="w-full h-full object-contain feather-edges"
                  />
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-1">L'Oracle des Miroirs</h3>
                <span className="text-xs text-gold-dark font-bold uppercase tracking-wider block mb-4">Par Dimitri d’Alfrange d’Uvruk</span>
                <p className="text-slate-650 text-sm font-light leading-relaxed mb-6">
                  L’Oracle des Miroirs est un jeu divinatoire moderne créé pour faciliter l’introspection et la découverte de soi. Chaque carte représente un aspect différent de la personnalité ou des situations de vie. Il invite à se regarder en face pour mieux comprendre, évoluer et transformer ce qui demande à l’être.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* Les Bienfaits Section */}
      <section 
        id="bienfaits" 
        className="py-14 md:py-16 bg-slate-100 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal-on-scroll">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">Les bienfaits des Oracles au quotidien</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-light">
              Les Oracles sont des outils de développement personnel et de guidance spirituelle. Ils favorisent l’introspection, aident à débloquer des émotions et encouragent à prendre du recul face aux situations du quotidien.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 reveal-on-scroll delay-100">
            {/* Benefit 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-serif font-bold text-xl text-brand-black mb-2">Guidance et clarification</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light">
                Ils mettent en lumière les énergies du moment présent pour vous aider à y voir plus clair dans vos choix de vie.
              </p>
            </div>
            {/* Benefit 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-serif font-bold text-xl text-brand-black mb-2">Stimulation de l’intuition</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light">
                En observant les illustrations et en lisant les messages, ils vous apprennent à écouter votre petite voix intérieure.
              </p>
            </div>
            {/* Benefit 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-serif font-bold text-xl text-brand-black mb-2">Travail d’introspection</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light">
                Les symboles ouvrent des pistes de réflexion pour mieux vous connaître et identifier certains blocages inconscients.
              </p>
            </div>
            {/* Benefit 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-serif font-bold text-xl text-brand-black mb-2">Apaisement mental</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light">
                Tirer une carte au quotidien offre un ancrage et un moment de pause propice à la méditation.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center max-w-2xl mx-auto reveal-on-scroll delay-200">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-light">
              Les cartes peuvent vous apporter des réponses, mais, bien sûr, il faut savoir être patient(e). Elles ne répondent pas toujours clairement aux questions posées et peuvent parfois se montrer capricieuses.
            </p>
          </div>
        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 3b. Mon Oracle Section */}
      <section 
        id="mon-oracle-c" 
        className="py-14 md:py-18 bg-slate-50 text-brand-black relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Mon Histoire</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
              Mon histoire… et celle de Mon Oracle C
            </h2>
            <div className="h-0.5 w-16 bg-gold/40 mx-auto mt-4" />
          </div>

          {/* Grid Layout */}
          <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-start">
            
            {/* Story Text Column */}
            <div className="md:col-span-7 space-y-8 text-left reveal-on-scroll">
              
              {/* Part 1: L'enfance et la découverte */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Une rencontre fortuite à l'âge de 14 ans
                </h3>
                
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Mon histoire avec les cartes a commencé à l'âge de 14 ans, lors d'un simple rassemblement familial.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Comme beaucoup d'enfants de mon âge, je jouais aux cartes avec mes cousins et cousines dans un café où notre famille était réunie. En observant les figures et les symboles, j'ai commencé, sans vraiment savoir pourquoi, à les interpréter. Je partageais simplement ce que je ressentais, sans imaginer que mes paroles faisaient écho à la réalité des personnes autour de moi.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Ce qui n'était au départ qu'un jeu a rapidement pris une toute autre dimension. Un vieil homme, installé au bout du bar, nous écoutait discrètement. Intrigué par ce qu'il venait d'entendre, il s'est approché de moi et m'a demandé de lui lire les cartes. À la fin du tirage, il m'a regardée avec étonnement et m'a dit :
                </p>

                <blockquote className="border-l-2 border-gold pl-4 italic text-slate-800 my-5 font-serif text-base md:text-lg bg-gold/5 py-2.5 pr-2">
                  « Tu viens de me décrire toute ma vie actuelle. Tout ce que tu m'as dit est vrai. »
                </blockquote>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Ces mots ont marqué un tournant dans ma vie. Pour la première fois, j'ai compris que ce que je percevais à travers les cartes dépassait largement le simple hasard.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  En discutant avec ma maman après cet événement, j'ai découvert qu'elle aussi possédait ce don et pratiquait la cartomancie. Elle m'a alors confié son jeu de 32 cartes, celui qui l'accompagnait depuis de nombreuses années. C'est avec ce jeu que j'ai développé mon intuition, affiné ma lecture des cartes et accompagné, au fil du temps, de nombreuses personnes dans leurs questionnements et leur chemin de vie.
                </p>
              </div>

              {/* Part 2: Création de l'Oracle C */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  La création de Mon Oracle C
                </h3>
                
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Des années plus tard, j'ai choisi de transformer ce jeu traditionnel de 32 cartes en un Oracle moderne, intuitif et accessible, sans jamais en trahir l'essence. J'ai repensé chaque symbole afin de le rendre plus simple, plus évocateur et plus facile à interpréter, tout en conservant la richesse de sa symbolique. Mon objectif était de créer un Oracle qui puisse parler à tous, que l'on découvre la cartomancie ou que l'on soit déjà passionné par cet univers.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans font-semibold">
                  C'est ainsi qu'est né Mon Oracle C.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Plus qu'un simple jeu de cartes, Mon Oracle C est un véritable compagnon de guidance. Il vous aide à obtenir une vision claire de votre situation actuelle, à mieux comprendre les énergies qui vous entourent et à recevoir des indications précieuses pour avancer avec confiance, même lorsque le chemin semble incertain.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Chaque carte a été pensée pour être intuitive, accessible et parlante. Grâce à ses symboles revisités, les messages apparaissent avec plus de simplicité, tout en conservant la profondeur d'interprétation qui fait la force du jeu traditionnel de 32 cartes.
                </p>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
                  Aujourd'hui, je suis heureuse de partager avec vous Mon Oracle C, un Oracle né d'une transmission familiale, de plus de trente années d'expérience et d'une profonde envie d'aider chacun à retrouver de la clarté, de la sérénité et la confiance nécessaire pour avancer sur son chemin de vie.
                </p>
              </div>

            </div>

            {/* Showcase Visual Column */}
            <div className="md:col-span-5 reveal-on-scroll delay-100">
              <div className="sticky top-28 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative group">
                  <img 
                    src="/assets/oracle_c.jpg" 
                    alt="Mon Oracle C" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  {/* Subtle caption overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-left">
                    <span className="text-white text-xs font-semibold tracking-wider uppercase">Mon Oracle C</span>
                    <span className="text-slate-200 text-[10px] block mt-0.5">Le jeu de cartes revisité</span>
                  </div>
                </div>

                <div className="mt-5 w-full bg-gold/5 border border-gold/20 p-5 rounded-xl text-left">
                  <h4 className="font-serif font-bold text-slate-800 text-sm block mb-1">Un pont entre tradition et modernité</h4>
                  <p className="text-slate-700 text-xs leading-relaxed font-light font-sans">
                    Inspiré du jeu traditionnel de 32 cartes et enrichi de symboles épurés, Mon Oracle C est conçu comme un outil d'accompagnement quotidien, accessible et réconfortant.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 4. Rencontre-moi / Bio Section */}
      <section 
        id="bio" 
        className="py-14 md:py-16 bg-white relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 md:gap-16 items-center">
          
          {/* Left Column: Black & White Photo with Accent Border */}
          <div className="md:col-span-5 order-last md:order-first reveal-on-scroll">
            <div className="relative group">
              {/* Decorative gold border box */}
              <div className="absolute -inset-4 border-2 border-gold/40 rounded-2xl pointer-events-none transform -translate-x-2 translate-y-2" />
              
              {/* Image Frame */}
              <div className="relative aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <img 
                  src="/assets/CathyBio.png" 
                  alt="Cathy Fabrizzi, coach en Oracles intuitifs à Wavre" 
                  className="w-full h-full object-cover hover-color-portrait"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Bio Copy */}
          <div className="md:col-span-7 text-left space-y-6 reveal-on-scroll delay-100">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Ma bio</span>
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">À propos de moi</h2>
              <h3 className="text-xl font-serif text-slate-800 font-semibold">Cathy Fabrizzi</h3>
              <div className="text-xs font-bold text-gold-dark uppercase tracking-wider">Coach en Oracles intuitifs</div>
            </div>

            <div className="space-y-4 text-slate-650 text-sm sm:text-base leading-relaxed font-light font-sans">
              <p>
                En 2025, après un véritable virage à 180° dans ma carrière professionnelle, j’ai décidé d’ouvrir ma propre entreprise de coaching et de guidance intuitive.
              </p>
              <p className="font-semibold text-slate-800">
                Pourquoi ce changement ?
              </p>
              <p>
                Parce qu’au fil des années, j’ai vu autour de moi tellement de personnes se sentir perdues, bloquées dans des situations compliquées, sans aide ni repères pour avancer. J’ai alors choisi de mettre mon don au service des autres afin de les accompagner avec bienveillance et clarté.
              </p>
              <p>
                Grâce à mes guidances intuitives, j’aide chacun à éclairer des situations complexes, à retrouver confiance et à envisager des directions auxquelles ils n’auraient parfois jamais pensé.
              </p>
              <p>
                Ce don fait partie de mon histoire depuis l’âge de 14 ans. Issu d’une transmission familiale, il s’est révélé très tôt à travers l’utilisation des Oracles. Avec le temps, mon intuition s’est développée jusqu’à me permettre aujourd’hui d’effectuer des prédictions avec une précision étonnante et d’accompagner les personnes sur leur chemin de vie.
              </p>
              <p>
                J’ai également réécrit, pour votre plus grand plaisir, l’Oracle qui a réveillé ce don en moi. Cet Oracle a été conçu comme un véritable outil de guidance : il peut vous aider à mieux comprendre votre situation, à recevoir des indications claires sur les actions à entreprendre et à apaiser les angoisses ou périodes de stress que vous traversez.
              </p>
              <p className="italic text-gold font-medium">
                Parce qu’il suffit parfois d’un message, d’un éclairage ou d’une direction pour retrouver son chemin.
              </p>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => scrollTo('formations')}
                className="px-8 py-4 bg-brand-black text-white hover:bg-gold hover:text-brand-black text-xs font-bold uppercase tracking-widest transition-all duration-300 font-sans shadow-md"
              >
                Découvrir les modules de formation
              </button>
            </div>

          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 5. Modules Section */}
      <section 
        id="formations" 
        className="py-14 md:py-16 bg-slate-100 text-brand-black relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Formations</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
              Formations aux Oracles à Wavre
            </h2>
            <p className="text-gold font-serif text-lg italic">
              Session à partir de septembre 2026
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 items-stretch reveal-on-scroll delay-100">
            {modules.map((mod) => (
              <div 
                key={mod.id}
                className="bg-white text-brand-black rounded-2xl p-8 border border-slate-200 shadow-xl flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Card Header Info */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 bg-gold/10 text-gold-dark text-[10px] font-bold uppercase tracking-widest border border-gold/20 rounded-full">
                      {mod.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      ★ Wavre
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-brand-black mb-4 min-h-[56px] flex items-center">
                    {mod.oracle}
                  </h3>
                  
                  <p className="text-slate-700 text-sm sm:text-base font-light leading-relaxed mb-6 font-sans">
                    {mod.description}
                  </p>
                </div>

                {/* Duration, Price & Action */}
                <div>
                  {/* Duration and Price info */}
                  <div className="my-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-sans">
                    <div className="text-xs text-slate-500 font-light text-left">
                      <span className="block font-semibold uppercase tracking-wider text-[9px] text-slate-400">Durée</span>
                      {mod.duration}
                    </div>
                    <div className="text-right">
                      <span className="block font-semibold uppercase tracking-wider text-[9px] text-slate-400">Tarif</span>
                      <span className="line-through text-slate-400 text-xs mr-2">{mod.oldPrice}</span>
                      <span className="text-brand-red font-bold text-lg">{mod.promoPrice}</span>
                    </div>
                  </div>



                  <button
                    onClick={() => handleBookModule(mod.id)}
                    className="w-full py-3.5 bg-brand-black hover:bg-brand-red text-white hover:text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md font-sans"
                  >
                    Réserver ce module
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Important Information Callout */}
          <div className="mt-16 bg-white border border-gold/30 rounded-2xl p-6 md:p-8 shadow-sm text-center max-w-3xl mx-auto reveal-on-scroll delay-150">
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-light font-sans">
              Les formations se déroulent en petits groupes afin de favoriser les échanges et un accompagnement personnalisé. Elles comprennent des exercices de pratique guidée, un support pédagogique, des travaux à réaliser à domicile ainsi qu’un certificat remis à l’issue de la formation.
            </p>
          </div>

          {/* Module note */}
          <div className="mt-8 text-center reveal-on-scroll delay-200">
            <p className="text-xs text-slate-400 font-light italic max-w-lg mx-auto leading-relaxed font-sans">
              Selon le module choisi, un support de prise de notes ainsi que les Oracles nécessaires peuvent être fournis. Valeur indicative : 80€.
            </p>
          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 6. Objective / Transformation Section */}
      <section 
        id="objectifs" 
        className="py-14 md:py-16 bg-white text-brand-black relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left side: Goals list */}
            <div className="space-y-6 text-left reveal-on-scroll">
              <h2 className="text-3xl md:text-4xl font-serif font-light text-brand-black">
                Modules de formation à l’Oracle GE, l’Oracle C et l’Oracle des Miroirs
              </h2>
              
              <div className="h-1.5 w-16 bg-gold rounded-full" />
              
              <p className="text-2xl md:text-3xl font-serif font-light text-slate-700 leading-normal">
                Te rendre <span className="text-gold font-normal">autonome</span> dans la lecture des cartes, pour toi et pour les autres, en très peu de temps.
              </p>
              

              <div className="pt-4">
                {/* Visual grid stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                    <span className="text-2xl font-serif text-gold block font-bold">30+</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Années d'exp</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                    <span className="text-2xl font-serif text-gold block font-bold">100%</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Autonomie</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                    <span className="text-2xl font-serif text-gold block font-bold">3</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Oracles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Bullet checklist */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-xl reveal-on-scroll delay-100 text-left">
              <p className="text-slate-700 text-sm sm:text-base font-light leading-relaxed mb-6 font-sans">
                Acquérir les bases essentielles pour comprendre les lames, interpréter les messages des cartes et construire des synthèses de lecture claires, que ce soit avec l’Oracle C, l’Oracle GE ou l’Oracle des Miroirs.
              </p>
              <ul className="space-y-4">
                {[
                  "Découverte des lames, des symboles et de leur langage",
                  "Méthode pour interpréter une guidance avec justesse",
                  "Apprentissage de la synthèse de lecture",
                  "Pratiques guidées sur l’Oracle C et/ou l’Oracle GE",
                  "Support de cours complet inclus"
                ].map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-650 font-light leading-relaxed font-sans">
                    <span className="text-brand-red font-bold text-base leading-none">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 7. Horaires Section */}
      <section 
        id="horaires" 
        className="py-14 md:py-16 bg-slate-100 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image of learning */}
          <div className="md:col-span-5 reveal-on-scroll">
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-gold/40 rounded-2xl pointer-events-none transform translate-x-2 -translate-y-2" />
              <div className="relative aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <img 
                  src="/assets/training_session.png" 
                  alt="Formation aux Oracles en petit groupe à Wavre" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Schedule / Info Details */}
          <div className="md:col-span-7 text-left space-y-6 reveal-on-scroll delay-100">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Horaires</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
              Horaires des formations
            </h2>

            <p className="text-slate-655 text-sm sm:text-base font-light leading-relaxed">
              Pour s'adapter au mieux à vos contraintes professionnelles et personnelles, chaque module est proposé sous plusieurs créneaux.
            </p>

            {/* Time slot highlights */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-serif font-semibold text-brand-black border-b border-slate-200 pb-3">Créneaux du Lundi au Vendredi</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 shadow-sm text-center">
                  <span className="text-xs text-slate-500 block uppercase font-bold">Matin</span>
                  <span className="font-serif font-bold text-slate-800 text-base">10h — 12h</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 shadow-sm text-center">
                  <span className="text-xs text-slate-500 block uppercase font-bold">Après-midi</span>
                  <span className="font-serif font-bold text-slate-800 text-base">14h — 16h</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 shadow-sm text-center">
                  <span className="text-xs text-slate-500 block uppercase font-bold">Fin d'après-midi</span>
                  <span className="font-serif font-bold text-slate-800 text-base">16h — 18h</span>
                  <span className="text-[9px] text-brand-red block font-semibold mt-0.5">(sauf le vendredi)</span>
                </div>
              </div>
            </div>

            {/* Warning block for small sizes */}
            <div className="p-4 bg-brand-red/5 border border-brand-red/20 rounded-xl text-center">
              <span className="text-sm font-bold text-brand-red font-sans">
                Places ultra limitées (Seulement 4 personnes par module)
              </span>
            </div>

            {/* Pourquoi 4 personnes Encart */}
            <div className="bg-slate-50 border-l-4 border-gold p-6 rounded-r-2xl mt-4 text-left">
              <h4 className="font-serif font-bold text-base text-brand-black mb-2">Pourquoi seulement 4 personnes ?</h4>
              <p className="text-slate-650 text-sm font-light leading-relaxed font-sans">
                Parce que chaque apprentissage mérite du temps, de l’attention et un accompagnement précis. Le format en petit groupe permet un vrai suivi, des échanges de qualité et une pratique guidée.
              </p>
            </div>

          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 8. Visual Gallery Section */}
      <section 
        id="galerie" 
        className="py-14 bg-white relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Immersion</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
              Une expérience intime et sereine
            </h2>
             <p className="text-slate-650 text-sm font-light">
              Que ce soit pour une séance de guidance ou une formation, vous serez accueilli(e) dans une atmosphère chaleureuse et bienveillante, propice à l’écoute, à l’échange et au développement de votre intuition.
             </p>
          </div>

          {/* Asymmetric photo gallery grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch reveal-on-scroll delay-100">
            
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between group">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white mb-4">
                <img 
                  src="/assets/training_session.png" 
                  alt="Formation aux Oracles en petit groupe à Wavre" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-center">
                <h4 className="font-serif font-bold text-base text-slate-800">Petit groupe</h4>
                <p className="text-slate-550 text-xs mt-0.5">Partage et bienveillance</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between group md:-translate-y-4 transition-transform duration-500">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white mb-4">
                <img 
                  src="/assets/oracle_cards_detail.png" 
                  alt="Cartes d’Oracles utilisées pour une séance de guidance intuitive" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-center">
                <h4 className="font-serif font-bold text-base text-slate-800">Support complet</h4>
                <p className="text-slate-550 text-xs mt-0.5">Apprentissage pas-à-pas</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between group">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white mb-4">
                <img 
                  src="/assets/booking_atmosphere.png" 
                  alt="Cadre apaisant pour une séance de guidance intuitive à Wavre" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-center">
                <h4 className="font-serif font-bold text-base text-slate-800">Cadre apaisant</h4>
                <p className="text-slate-550 text-xs mt-0.5">Idéal pour l'intuition</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 9. Booking Section */}
      <section 
        id="reservation" 
        className="py-14 md:py-16 bg-slate-100 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Column: Call to action options */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-8 text-left reveal-on-scroll">
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Réserver</span>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
                Réserver une séance ou une formation
              </h2>
              <p className="text-slate-600 text-sm font-light leading-relaxed">
                Remplissez notre formulaire de contact ci-contre. Je prendrai contact avec vous sous 24h à 48h afin de valider ensemble le créneau et les détails de votre réservation.
              </p>
            </div>

            {/* Quick choices items */}
            <div className="space-y-4">
              <div 
                onClick={() => setRequestType('guidance')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  requestType === 'guidance' 
                    ? 'border-gold bg-gold/5 shadow-inner' 
                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-lg text-brand-black">Séance de guidance</h3>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${requestType === 'guidance' ? 'border-brand-red bg-brand-red' : 'border-slate-400'}`}>
                    {requestType === 'guidance' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-light mt-2 leading-relaxed">
                  Pour recevoir un éclairage personnel sur une situation et avancer sereinement.
                </p>
              </div>

              <div 
                onClick={() => setRequestType('formation')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  requestType === 'formation' 
                    ? 'border-gold bg-gold/5 shadow-inner' 
                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-lg text-brand-black">Formation aux Oracles</h3>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${requestType === 'formation' ? 'border-brand-red bg-brand-red' : 'border-slate-400'}`}>
                    {requestType === 'formation' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-light mt-2 leading-relaxed">
                  Pour apprendre à comprendre, maîtriser et interpréter vous-même les cartes.
                </p>
              </div>

              <div 
                onClick={() => setRequestType('achat-oracle-c')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  requestType === 'achat-oracle-c' 
                    ? 'border-gold bg-gold/5 shadow-inner' 
                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-lg text-brand-black">Informations sur l'Oracle C</h3>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${requestType === 'achat-oracle-c' ? 'border-brand-red bg-brand-red' : 'border-slate-400'}`}>
                    {requestType === 'achat-oracle-c' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-light mt-2 leading-relaxed">
                  Pour toute information concernant mon Oracle C.
                </p>
              </div>
            </div>

            {/* Quick trust visual */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200/60 rounded-xl">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-gold/30">
                <img 
                  src="/assets/booking_atmosphere.png" 
                  alt="Booking cabinet Victoria" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs font-light text-slate-500">
                <span className="font-semibold text-slate-700 block">Des questions ?</span>
                <span>Contactez-nous directement via ce formulaire.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="md:col-span-7 reveal-on-scroll delay-100">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Prénom</label>
                    <input 
                      id="firstName"
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Nom</label>
                    <input 
                      id="lastName"
                      type="text" 
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Email</label>
                    <input 
                      id="email"
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean.dupont@email.com"
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Téléphone</label>
                    <input 
                      id="phone"
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0470 00 00 00"
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Demand details selector (dynamic rendering based on type chosen) */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="requestType" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Prestation souhaitée</label>
                    <select
                      id="requestType"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black"
                    >
                      <option value="guidance">Séance de Guidance Individuelle</option>
                      <option value="formation">Formation aux Oracles</option>
                      <option value="achat-oracle-c">Informations sur l'Oracle C</option>
                    </select>
                  </div>
                  <div>
                    {requestType === 'formation' && (
                      <>
                        <label htmlFor="module" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Choix du module</label>
                        <select
                          id="module"
                          value={selectedModule}
                          onChange={(e) => setSelectedModule(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black"
                        >
                          <option value="aucun">Sélectionner un module</option>
                          <option value="module-1">Module 1. Oracle GE</option>
                          <option value="module-2">Module 2. Oracle C + GE</option>
                          <option value="module-3">Module 3. Oracles C, GE et Miroirs</option>
                          <option value="tous">Cycle complet (3 modules)</option>
                        </select>
                      </>
                    )}
                    {requestType === 'guidance' && (
                      <>
                        <label htmlFor="guidanceType" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Type de Guidance</label>
                        <select
                          id="guidanceType"
                          value={selectedGuidanceType}
                          onChange={(e) => setSelectedGuidanceType(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black"
                        >
                          <option value="lumiere">Guidance Lumière (35€)</option>
                          <option value="complete">Guidance Complète (60€)</option>
                          <option value="signature">Guidance Signature (80€)</option>
                        </select>
                      </>
                    )}

                  </div>
                </div>

                {requestType === 'guidance' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="timeSlot" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Créneau préféré</label>
                      <select
                        id="timeSlot"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black"
                      >
                        <option value="">Sélectionner une période</option>
                        <option value="matin">Matinée (10h - 12h)</option>
                        <option value="aprem">Après-midi (14h - 16h)</option>
                        <option value="soir">Fin d'après-midi (16h - 18h)</option>
                      </select>
                    </div>
                    <div></div>
                  </div>
                )}

                <div>
                  <label htmlFor="message" className="block text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Précisions ou Message</label>
                  <textarea 
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez vos questions ou vos disponibilités particulières..."
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-brand-black placeholder-slate-400 resize-none"
                  />
                </div>



                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-black text-white hover:bg-gold hover:text-brand-black font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md shadow-brand-black/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    requestType === 'achat-oracle-c' 
                      ? 'Envoyer ma demande' 
                      : requestType === 'guidance' 
                        ? 'Prendre rendez-vous' 
                        : 'Réserver ma place'
                  )}
                </button>

              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Retours d'expériences Section */}
      <div className="h-[2px] w-full bg-gold relative z-20" />
      <section 
        id="temoignages" 
        className="py-8 md:py-10 bg-white relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Témoignages</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">Témoignages de personnes accompagnées</h2>
            <p className="text-slate-600 text-sm font-light font-sans">
              Découvrez les retours et témoignages des personnes accompagnées en guidance ou formées aux Oracles.
            </p>
          </div>

          {/* Testimonials loaded from /data/temoignages.json */}
          <div className="grid md:grid-cols-3 gap-3 items-start reveal-on-scroll delay-100">
            {[0, 1, 2].map(col => (
              <div key={col} className="space-y-3">
                {testimonials.filter((_, i) => i % 3 === col).map((testi, i) => (
                  <div key={i} className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left hover:shadow-md hover:border-gold transition-all duration-300">
                    <p className="text-slate-700 text-sm sm:text-base italic font-light leading-relaxed mb-3 font-sans whitespace-pre-line">
                      « {testi.text} »
                    </p>
                    <div>
                      <div className="h-px bg-slate-200 my-2" />
                      <h4 className="font-serif font-bold text-slate-900 text-base">{testi.author}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-[2px] w-full bg-gold relative z-20" />

      {/* 10. Final Call To Action & Details Section */}
      <section 
        id="contact" 
        className="bg-slate-100 text-brand-black py-14 md:py-16 relative z-10"
      >
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12 reveal-on-scroll">
          
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold block">Contact</span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-brand-black">
              Contact Cabinet Victoria à Wavre
            </h2>
            <blockquote className="text-xl md:text-2xl font-serif leading-tight italic text-slate-700 py-4 max-w-3xl mx-auto block">
              « Apprendre à lire les cartes est une expérience extraordinaire. C'est développer la capacité de décoder les messages qu'elles révèlent, de mieux comprendre les énergies du moment et d'entrevoir les différentes possibilités qui s'offrent à nous pour construire notre avenir. »
            </blockquote>
            <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto font-light">
              Que ce soit pour une guidance personnelle ou une formation complète, je t’accompagne avec douceur, méthode et précision.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="#reservation"
              onClick={(e) => { e.preventDefault(); scrollTo('reservation'); }}
              className="px-8 py-4 bg-gold text-brand-black hover:bg-brand-black hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center"
            >
              Réserver maintenant
            </a>
            <a 
              href="mailto:&quot;Cabinet Victoria&quot; &lt;info@victoriaguidancesintuitives.be&gt;"
              className="px-8 py-4 border border-slate-300 text-brand-black hover:bg-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center"
            >
              Me contacter par email
            </a>
          </div>

          {/* Details / Address details */}
          <div className="pt-8 border-t border-slate-200 grid sm:grid-cols-2 gap-6 text-xs text-slate-600 max-w-2xl mx-auto text-left sm:text-center">
            <div className="space-y-1.5">
              <span className="font-semibold text-brand-black block uppercase tracking-wider">Adresse du cabinet</span>
              <span>Wavre, Belgique (Adresse précise communiquée lors de l'inscription)</span>
            </div>
            <div className="space-y-1.5">
              <span className="font-semibold text-brand-black block uppercase tracking-wider">Contact Direct</span>
              <a href="mailto:info@victoriaguidancesintuitives.be" className="hover:text-gold transition-colors block">
                info@victoriaguidancesintuitives.be
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-black py-10 border-t border-slate-900 text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6 text-center mb-8">
          <div className="flex flex-col items-center">
            <img 
              src="/assets/logo_isolated.png" 
              alt="Logo Victoria" 
              className="h-12 md:h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
            />
            <span className="text-[9px] uppercase tracking-[0.22em] text-gold font-bold mt-2">
              Guidances & Formations
            </span>
          </div>
          <div className="h-px w-20 bg-slate-800/80" />
        </div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-slate-400">Cabinet Victoria Guidances — Wavre</p>
            <p className="mt-1">Guidance intuitive & formations aux Oracles</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="/assets/mentions-legales-confidentialite.pdf" download className="hover:text-white transition-colors">Mentions légales & Politique de confidentialité ↓</a>
          </div>
          {/* Social media icons */}
          <div className="flex justify-center items-center gap-5">
            <a href="https://www.facebook.com/search/top?q=victoria%20guidances%20intuitives" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-500 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/victoria_guidancesintuitives/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-500 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@victoria.guidancesintuit" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-slate-500 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
          </div>
          <div>
            © {new Date().getFullYear()} Cabinet Victoria. Tous droits réservés.
          </div>
        </div>
        {/* Mentions légales discrètes */}
        <div className="max-w-4xl mx-auto px-6 mt-6 pt-6 border-t border-slate-800/60 text-center text-[10px] leading-relaxed text-slate-600 space-y-1.5">
          <p>Victoria Voyance Consult — Guidance intuitive, voyance, coaching et formations.</p>
          <p>Site édité par Victoria Voyance Consult — BCE : 1025.732.042 — TVA : non assujettie — Contact : info@victoriaguidancesintuitives.be.</p>
          <p>Adresse : Chemin de Louvrange 10, 1300 Wavre, Belgique.</p>
          <p>Hébergement : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.</p>
          <p className="italic text-slate-700">Les séances proposées sont des accompagnements intuitifs, spirituels et symboliques, sans garantie de résultat, et ne remplacent pas un avis médical, psychologique, juridique ou financier.</p>
        </div>
      </footer>

      {/* Custom Popup Modals */}
      {activePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => activePopup !== 'simulation-choice' && setActivePopup(null)}
          />
          
          {/* Modal Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center relative z-10 animate-fade-in font-sans">
            
            {activePopup === 'success' && (
              <>
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-655 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-sm">
                  ✓
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-3">Envoi réussi</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                  Votre demande a bien été enregistrée. Nous vous contacterons par e-mail dans les plus brefs délais.
                </p>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="w-full py-3 bg-brand-black hover:bg-gold hover:text-brand-black text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md"
                >
                  Fermer
                </button>
              </>
            )}

            {activePopup === 'error' && (
              <>
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-655 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-sm">
                  ✕
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-3">Erreur</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                  Une erreur est survenue lors de l’envoi du formulaire. Veuillez réessayer dans quelques instants ou nous contacter directement par e-mail.
                </p>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="w-full py-3 bg-brand-black hover:bg-gold hover:text-brand-black text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md"
                >
                  Fermer
                </button>
              </>
            )}

            {activePopup === 'simulation-choice' && (
              <>
                <div className="w-16 h-16 bg-gold/10 border border-gold/20 text-gold-dark rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-sm">
                  ℹ
                </div>
                <h3 className="text-2xl font-serif text-brand-black mb-3">Simulation d'envoi</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                  Choisissez le résultat à simuler pour l'envoi de votre demande de réservation.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      // Reset form
                      setFirstName('')
                      setLastName('')
                      setEmail('')
                      setPhone('')
                      setSelectedGuidanceType('lumiere')
                      setTimeSlot('')
                      setMessage('')
                      setActivePopup('success')
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm"
                  >
                    Simuler un Succès
                  </button>
                  <button 
                    onClick={() => {
                      setActivePopup('error')
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm"
                  >
                    Simuler une Erreur
                  </button>
                  <button 
                    onClick={() => setActivePopup(null)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest transition-all duration-300"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

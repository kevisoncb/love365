"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Importado para melhor performance

export default function Home() {
  // Estado para o FAQ inteligente (abre um e fecha os outros)
  const [perguntaAberta, setPerguntaAberta] = useState<number | null>(null);

  const passos = [
    {
      numero: "01",
      titulo: "Conte sua história",
      desc: "Preencha os nomes, a data especial e escolha aquela foto que resume vocês.",
      icon: "✍️"
    },
    {
      numero: "02",
      titulo: "Escolha seu plano",
      desc: "Selecione entre o Essencial ou Premium e finalize o pagamento via PIX ou Cartão.",
      icon: "💳"
    },
    {
      numero: "03",
      titulo: "Link Instantâneo",
      desc: "Assim que o pagamento for aprovado, seu link exclusivo é liberado na hora.",
      icon: "🚀"
    },
    {
      numero: "04",
      titulo: "Faça uma surpresa",
      desc: "Envie o link para o seu amor e veja a emoção de recordar cada segundo juntos.",
      icon: "🎁"
    }
  ];

  const faqs = [
    { q: "O que é a Love365?", a: "É uma plataforma onde você cria uma página exclusiva para o seu relacionamento com contador em tempo real, fotos e música personalizada." },
    { q: "Quais métodos de pagamento estão disponíveis?", a: "Aceitamos PIX e cartões de crédito. O pagamento é processado de forma segura e a liberação da página é imediata." },
    { q: "Quanto tempo a página fica no ar?", a: "Uma vez paga, a sua página é eterna! Sem assinaturas ou taxas extras." },
    { q: "É possível editar os dados depois de pronta?", a: "No momento não. Mas em breve lançaremos um painel de edição para todos os clientes!" }
  ];

  const Logo = () => (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#db2777"/>
      </svg>
      <span className="text-2xl font-bold text-pink-600 tracking-tighter italic">Love365</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black pt-20">
      
      {/* CABEÇALHO FIXO */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <a href="#inicio" className="hover:text-pink-600 transition-colors">Início</a>
            <a href="#como-fazer" className="hover:text-pink-600 transition-colors">Como Fazer</a>
            <a href="#faq" className="hover:text-pink-600 transition-colors">Perguntas</a>
            <Link href="/criar" className="bg-pink-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-pink-700 transition-all shadow-md">Criar Agora</Link>
          </div>
        </div>
      </nav>

      {/* SEÇÃO PRINCIPAL (HERO) */}
      <main id="inicio" className="flex min-h-[80vh] w-full max-w-6xl flex-col md:flex-row items-center justify-between gap-12 bg-white dark:bg-zinc-900 p-8 md:p-16 rounded-[2.5rem] shadow-2xl overflow-hidden mx-auto mt-10">
        <div className="flex flex-col items-center md:items-start gap-8 text-center md:text-left md:w-1/2">
          <div className="text-sm font-bold text-pink-600 uppercase tracking-widest bg-pink-50 px-4 py-1 rounded-full italic">O presente perfeito ❤️</div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            Eternize seu amor com uma página única.
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="border border-pink-100 p-4 rounded-2xl bg-pink-50/30">
              <h3 className="font-bold text-pink-600 text-sm uppercase">Essencial</h3>
              <p className="text-2xl font-black text-zinc-800">R$ 29,90</p>
            </div>
            <div className="border-2 border-pink-500 p-4 rounded-2xl bg-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Mais Vendido</span>
              <h3 className="font-bold text-pink-600 text-sm uppercase">Premium</h3>
              <p className="text-2xl font-black text-pink-600">R$ 49,90</p>
            </div>
          </div>

          <Link href="/criar" className="flex h-14 w-full items-center justify-center rounded-full bg-pink-600 text-white transition-all hover:bg-pink-700 md:w-[240px] shadow-lg font-bold text-lg hover:scale-105">
            Criar Nossa Página
          </Link>
        </div>

        {/* PROTÓTIPO COM A FOTO LOCAL (casal.jpg) */}
        <div className="md:w-1/2 flex justify-center w-full relative">
          <div className="relative w-full max-w-[300px] bg-pink-50 rounded-[3rem] p-4 shadow-2xl border-8 border-white transform rotate-2">
            <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border-2 border-white bg-zinc-200 relative">
              <img 
                src="/casal.jpg" 
                alt="Nosso Amor" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-zinc-800 text-lg italic">Ana & Leo</h4>
              <p className="text-pink-600 text-xs mb-4">Juntos há 842 dias</p>
              <div className="grid grid-cols-3 gap-1">
                {['02', '10', '45'].map((v, i) => (
                  <div key={i} className="bg-white p-2 rounded-xl border border-pink-100">
                    <span className="block text-sm font-bold text-pink-500 leading-none">{v}</span>
                    <span className="text-[7px] uppercase text-zinc-400 mt-1 block font-bold tracking-tighter">{['Anos', 'Meses', 'Dias'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* COMO FAZER */}
      <section id="como-fazer" className="max-w-6xl mx-auto mt-28 mb-20 px-4">
        <h2 className="text-3xl font-bold text-center text-zinc-800 dark:text-white mb-16 italic">Como funciona? ✨</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {passos.map((p, i) => (
            <div key={i} className="relative group p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(219,39,119,0.2)] hover:-translate-y-2">
              <div className="absolute -top-5 -left-2 bg-pink-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg transform -rotate-12 group-hover:rotate-0 transition-all">{p.numero}</div>
              <div className="text-5xl mb-6 mt-2">{p.icon}</div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tighter">{p.titulo}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{p.desc}</p>
              <span className="absolute bottom-6 right-8 text-7xl font-black text-zinc-100 dark:text-zinc-800 group-hover:text-pink-50 transition-colors -z-10">{p.numero}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ INTELIGENTE */}
      <section id="faq" className="max-w-3xl mx-auto mt-28 mb-28 px-4">
        <h2 className="text-3xl font-bold text-center text-zinc-800 dark:text-white mb-12 italic">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div 
              key={i} 
              className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden ${perguntaAberta === i ? 'border-pink-500 shadow-xl scale-[1.02]' : 'border-zinc-200 dark:border-zinc-800 shadow-sm'}`}
            >
              <button 
                onClick={() => setPerguntaAberta(perguntaAberta === i ? null : i)}
                className="w-full flex items-center justify-between p-7 text-left font-bold text-lg text-zinc-800 dark:text-zinc-200"
              >
                {item.q}
                <span className={`text-pink-500 transition-transform duration-300 ${perguntaAberta === i ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </span>
              </button>
              <div className={`transition-all duration-300 ease-in-out ${perguntaAberta === i ? 'max-h-[500px] opacity-100 p-7 pt-0' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium text-sm">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <Logo />
          <div className="text-center text-zinc-500 text-[10px] md:text-xs">
            <p>Copyright © 2025 Love365.com.br - Todos os direitos reservados</p>
            <p className="mt-2 tracking-widest uppercase text-[8px]">Feito com carinho para o seu amor</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
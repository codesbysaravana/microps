import React, { useState } from 'react';

export const LandingFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does MicrOps achieve sub-10ms cold starts across global regions?',
      answer: 'Our Core Orchestrator maintains warm neural-link shards at edge POPs worldwide. When an ingress request triggers an idle service, pre-initialized micro-VMs attach to network sockets instantaneously without kernel boot overhead.'
    },
    {
      question: 'Can we integrate MicrOps with our existing Terraform or Kubernetes manifests?',
      answer: 'Yes. MicrOps acts as an intelligence wrapper over standard Kubernetes and declarative YAML definitions. You can import existing Helm charts or GitOps repositories directly with zero modification.'
    },
    {
      question: 'What happens during a multi-region cloud provider outage?',
      answer: 'Our global health synchronizer monitors multi-cloud latency pulses at 100ms intervals. If an AWS or GCP region drops packet verification, BGP anycast routes automatically failover traffic to secondary active clusters in under 4 milliseconds.'
    },
    {
      question: 'How does the transparent pay-for-compute pricing work?',
      answer: 'We bill strictly per millisecond of active CPU/RAM compute duration. There are zero artificial bandwidth markups, zero per-seat licensing traps, and zero idle container charges.'
    }
  ];

  return (
    <section id="faq" className="py-24 px-6 sm:px-12 max-w-4xl mx-auto select-none border-t border-[#1C1B1B]">
      <div className="text-center mb-16 space-y-3">
        <h2 className="font-headline-md text-3xl sm:text-4xl font-semibold text-[#F5F5F0]">
          Frequently Asked Questions
        </h2>
        <p className="font-body-md text-sm sm:text-base text-neutral-400">
          Everything you need to know about our infrastructure architecture.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-[#131313] border border-[#2A2A2A] rounded-2xl overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-[#1C1B1B]/40 transition-colors"
            >
              <span className="font-headline-md text-lg sm:text-xl text-[#F5F5F0] font-medium">
                {faq.question}
              </span>
              <span className={`text-[#D4AF37] font-mono text-xl transition-transform duration-300 shrink-0 ${openIndex === index ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-6 text-neutral-400 font-body-md text-sm sm:text-base leading-relaxed border-t border-[#2A2A2A]/40 pt-4">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

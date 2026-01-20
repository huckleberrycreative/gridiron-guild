import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Trophy, Crown, Star, Award, Medal, Sparkles } from 'lucide-react';

// Decorative corner component
const OrnateCorner = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path
      d="M0 40V30C0 13.4315 13.4315 0 30 0H40"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="30" cy="10" r="3" fill="currentColor" />
    <circle cx="10" cy="30" r="3" fill="currentColor" />
  </svg>
);

const Pantheon = () => {
  return (
    <Layout>
      <section className="py-12 md:py-16 relative overflow-hidden min-h-[70vh]">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          {/* Header with ornate styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center relative"
          >
            {/* Decorative line above */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
              <Sparkles className="text-gold" size={20} />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-wider">
              <span className="bg-gradient-to-b from-gold via-gold/90 to-gold/70 bg-clip-text text-transparent drop-shadow-lg">
                THE PANTHEON
              </span>
            </h1>

            {/* Subtitle with decorative elements */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent/40 to-accent/60" />
              <Crown className="text-gold" size={16} />
              <div className="h-px w-24 bg-gradient-to-l from-transparent via-accent/40 to-accent/60" />
            </div>

            <p className="text-muted-foreground max-w-2xl mx-auto italic text-lg">
              "Immortalized forever in the annals of Men's League history"
            </p>

            {/* Decorative line below */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-32 bg-gradient-to-r from-transparent to-gold/30" />
              <div className="w-2 h-2 rotate-45 bg-gold/50" />
              <div className="h-px w-32 bg-gradient-to-l from-transparent to-gold/30" />
            </div>
          </motion.div>

          {/* Empty State - Awaiting Inductees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              {/* Ornate corners */}
              <OrnateCorner className="absolute -top-1 -left-1 text-gold/60" />
              <OrnateCorner className="absolute -top-1 -right-1 text-gold/60 rotate-90" />
              <OrnateCorner className="absolute -bottom-1 -left-1 text-gold/60 -rotate-90" />
              <OrnateCorner className="absolute -bottom-1 -right-1 text-gold/60 rotate-180" />

              {/* Card */}
              <div className="bg-gradient-to-b from-gold/10 via-gold/5 to-transparent rounded-lg border-2 border-gold/30 p-12 text-center relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {/* Inner decorative border */}
                <div className="absolute inset-3 border border-gold/20 rounded pointer-events-none" />

                {/* Trophy icon with glow */}
                <div className="relative mx-auto mb-6 w-24 h-24">
                  <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-b from-gold/20 to-gold/5 border-2 border-gold/30 flex items-center justify-center">
                    <Trophy className="text-gold/50 drop-shadow-lg" size={44} />
                  </div>
                </div>

                <h3 className="font-display text-2xl font-bold mb-4 text-gold/70">
                  Awaiting Legends
                </h3>

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-2 my-6">
                  <div className="h-px w-12 bg-gold/30" />
                  <div className="w-1.5 h-1.5 rotate-45 bg-gold/50" />
                  <div className="h-px w-12 bg-gold/30" />
                </div>

                <p className="text-muted-foreground/80 max-w-md mx-auto italic">
                  The halls stand empty, waiting for those who will etch their names into eternity.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bottom flourish */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/20" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rotate-45 bg-gold/30" />
                <div className="w-1.5 h-1.5 rotate-45 bg-gold/50" />
                <div className="w-1.5 h-1.5 rotate-45 bg-gold/30" />
              </div>
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/20" />
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Pantheon;

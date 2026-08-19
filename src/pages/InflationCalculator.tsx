import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INFLATION_RATE = 1.108;

export default function InflationCalculator() {
  const [postTutenValue, setPostTutenValue] = useState<string>('');
  const [preTutenValue, setPreTutenValue] = useState<string>('');

  const postValue = parseFloat(postTutenValue);
  const preValue = parseFloat(preTutenValue);

  const inflatedValue = !isNaN(postValue) ? postValue * INFLATION_RATE : null;
  const difference = inflatedValue !== null && !isNaN(preValue) ? inflatedValue - preValue : null;

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">
              Inflation Calculator
            </h1>
            <p className="text-muted-foreground">
              Adjust trade values for the post-Tuten market. Post-Tuten value multiplied by 1.108.
            </p>
          </motion.div>

          <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="font-display text-xl">Trade Value Converter</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="post-tuten" className="font-medium">
                    Post-Tuten Trade Value
                  </Label>
                  <Input
                    id="post-tuten"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 100"
                    value={postTutenValue}
                    onChange={(e) => setPostTutenValue(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    The current value after the Tuten trade.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pre-tuten" className="font-medium">
                    Pre-Tuten Trade Value
                  </Label>
                  <Input
                    id="pre-tuten"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 90"
                    value={preTutenValue}
                    onChange={(e) => setPreTutenValue(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    The historical value before the Tuten trade.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
                <div className="text-center mb-6">
                  <div className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">
                    Inflation-Adjusted Value
                  </div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary">
                    {inflatedValue !== null ? `$${inflatedValue.toFixed(2)}` : '$—'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {postTutenValue && !isNaN(postValue)
                      ? `$${postValue} × 1.108 = $${inflatedValue?.toFixed(2)}`
                      : 'Enter a Post-Tuten value to calculate'}
                  </div>
                </div>

                {difference !== null && (
                  <div className="text-center border-t border-primary/10 pt-4">
                    <div className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-1">
                      vs. Pre-Tuten Value
                    </div>
                    <div
                      className={`font-mono text-lg font-semibold ${
                        difference >= 0 ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {difference >= 0 ? '+' : ''}
                      {difference.toFixed(2)} differential
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground text-center">
                The Tuten Trade Inflation Rate is fixed at{' '}
                <span className="font-mono font-medium text-foreground">10.8%</span> for all
                post-Tuten valuations.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

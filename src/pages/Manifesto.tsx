import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Scroll, Quote } from 'lucide-react';

const Manifesto = () => {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Scroll className="mx-auto text-gold mb-4" size={48} />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Fantasy Football is My Westworld</h1>
            <p className="text-xl text-muted-foreground italic">ESPN's default H2H fantasy football system is broken. So I set out to fix it.</p>
            <p className="mt-4 text-accent font-semibold">By Benjamin Holcomb, Commissioner</p>
          </motion.div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            {/* Abstract */}
            <div className="bg-gradient-to-br from-gold/10 to-accent/10 rounded-lg border border-gold/30 p-6 md:p-8 mb-8">
              <h2 className="font-display text-xl font-bold mb-3 text-foreground">Abstract</h2>
              <p className="text-foreground/90 italic">
                After multiple successive years of improved fantasy football parity, competitiveness, and enjoyment, this essay lays out the next great frontier in fantasy football. As suggested in the title, its parameters are my magnum opus… my Westworld.
              </p>
            </div>

            {/* Introduction */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 mb-8">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Introduction</h2>
              <p className="text-foreground/90 mb-4">Before breaking down the intricacies of my league's 2017–2018 format, it's important that I first define some basic fantasy football terms.</p>
              
              <h3 className="font-display text-lg font-bold mt-6 mb-2 text-foreground">What is Fantasy Football?</h3>
              <p className="text-foreground/90 mb-4">Fantasy football is a weekly competition in which owners manage "teams" consisting of individual NFL players, with the stated goal of scoring the most points possible. Here, points are defined as a system of measurement drawing from traditionally accumulated stats (passing, rushing, receiving, TDs, etc.)</p>
              
              <h3 className="font-display text-lg font-bold mt-6 mb-2 text-foreground">How is success defined in fantasy football?</h3>
              <p className="text-foreground/90 mb-4">A successful team is one that scores lots of points. On a spectrum from 0–150, the closer a team's weekly average is to 150, the more successful it is. Depending on the format of the fantasy football league, this definition of success might take on slightly different forms, but for all intents and purposes, this point-dependent goal persists.</p>
              
              <h3 className="font-display text-lg font-bold mt-6 mb-2 text-foreground">What, then, is the goal of a fantasy league?</h3>
              <p className="text-foreground/90">A fantasy league, consisting of 10–14 individually owned teams, is a season long competition aiming to identify the BEST team. Since money is usually on the line—in the range of $300–500, the definition of best becomes one of utmost importance.</p>
            </div>

            {/* Problems with Current Model */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 mb-8">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Problems with Our Current Model</h2>
              <p className="text-foreground/90 mb-6">Given the easily defined and objective answers to the three questions above, a few clear issues arise with our traditional format of fantasy football.</p>
              
              <div className="border-l-4 border-accent pl-4 mb-6">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Issue #1: Head to Head</h3>
                <p className="text-foreground/90 mb-4">In fantasy football where the objective is to score the most points, one is only capable of influencing his/her team's point outcome. There is no way for an owner to negatively influence their opponent's point total.</p>
                <p className="text-foreground/90 mb-4">e.g. If player A scores 149 points in one week, we would consider this tremendous success on our spectrum. But in the traditional head to head model, if their opponent, player B, scores 150, suddenly player A loses. Furthermore, if Player C scores 25 and their opponent, Player D, scores 24, our spectrum would identify this as extremely unsuccessful on our spectrum, and yet Player C would join Player B for that week as a "winner." Of course, Player D and Player A are categorized as "losers" for that particular week.</p>
                <p className="text-foreground/90 mb-4">In an ecosystem where wins and losses are the primary currency week to week, this format weakens the overall goal of identifying and rewarding success.</p>
                <p className="text-foreground/90 font-semibold">One more extreme example to prove a point:</p>
                <p className="text-foreground/90">It's possible in a 14-team league for a player to be the second-highest scorer every week and finish with a 0–12 record. It's also possible in a 14-team league for a player to be the second-lowest scorer every week and finish with a 12–0 record. In both cases, the stated goal of identifying the most successful fantasy owners over the course of an NFL season fails in the head to head model.</p>
              </div>

              <div className="border-l-4 border-gold pl-4 mb-6">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Issue #2: Defining the Best Team</h3>
                <p className="text-foreground/90 mb-4">In the art of crowning a champion, fantasy football ought to lean more toward the college football model than the March Madness one, which is to say the playoffs should properly represent the outcome of 71%+ of the games.</p>
                <p className="text-foreground/90 mb-4">In a 12-team league where half or more of the teams make the playoffs, and the only thing the regular season decides is seeding, randomness is king. Indeed, the only certainty week to week in fantasy is volatility.</p>
                <p className="text-foreground/90 mb-4">For reasons not far beyond my own personal failings as a human being, I sympathize with the fantasy owner who works 12 weeks to go undefeated and receive the #1 seed, only to lose in the first round of the playoffs to a 5–7 8-seed whose backup tight end randomly has a career day and whose low-scoring roster improves by seven standard deviations.</p>
                <p className="text-foreground/90 mb-4">Defining "the best team" by zeroing in on the last four weeks of the season—when many of the highest performing fantasy players are either resting for the playoffs or sitting out because their team has already been eliminated and they have nothing to play for—makes little sense.</p>
                <p className="text-foreground/90">And yet part of the agony and ecstasy of fantasy football is the money-on-the-line, waiting-for-the-river-card-to-drop tension of a playoff matchup. So simply awarding the championship to whoever scores the most points over 17 weeks also seems insufficient.</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Issue #3: Our Playoff System</h3>
                <p className="text-foreground/90 mb-4">Currently half of our league makes the playoffs. While the #1 seed getting a bye adds importance to the regular season, there is not proper credit given to the top four teams. Our 2016–17 season as an example, the #1 seed was a clear beneficiary of a randomly low points against schedule, while our 2nd and 3rd seeds were far and away the highest scorers over the course of the regular season.</p>
                <p className="text-foreground/90 mb-4">Their reward was playing 6–5 and 5–6 teams who went off against all odds and ended their season.</p>
                <p className="text-foreground/90 mb-4">Now the two-week playoff matchup format is a marked improvement over the one-week model. It mitigates the randomness, but not enough.</p>
                <p className="text-foreground/90">If a 5–6 makes the playoffs as the 7-seed in a 14-team league, then wins, I don't think anyone would argue they were the best team in that league. The more sensible conclusion is that they were the hottest team from weeks 13–17. While there is something to be said about being at your best when it matters most, fantasy football is significantly impacted by injuries, byes, players resting once playoff seeding is finalized, and real life matchups, so a hat tip must be made to holistic success and consistency.</p>
              </div>
            </div>

            {/* The Next Frontier */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 mb-8">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">The Next Frontier</h2>
              <p className="text-foreground/90 mb-6">The following proposed rule changes for our 2017–18 season aim to address the three biggest issues our league continues to face, while honoring the goals of rewarding fantasy success and ensuring the best team is hoisting the trophy at year's end.</p>
              
              <div className="border-l-4 border-green-500 pl-4 mb-6">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Rule Change #1: Starting Lineups of 9 Offensive Utility Players</h3>
                <p className="text-foreground/90 mb-4">We made a major stride this season in the abolishment of defenses and kickers. It made a world of difference for competitiveness and entertainment value. But I'm afraid we made an error in our redistribution of those positions into an extra TE and extra flex. The TE position in the NFL is too top heavy to justify 12–14 teams all needing 3–4 TEs on their rosters (to counter injuries and byes). There are only about 8 strong TEs overall, which doesn't even come out to 1 per team. This left that extra TE position as a similarly random and precarious slot to last year's defenses and kickers.</p>
                <p className="text-foreground/90 mb-4">I believe a principle aspect of identifying success in fantasy football is allowing owner's strategy to take a front seat. For player A to be more successful than player B he has to score more points, true, but I think our rules should make it so the total point outcome is a byproduct of smart drafting, roster assembly and game day decisions.</p>
                <p className="text-foreground/90 mb-4">The best way to do this, of course, is with the free market.</p>
                <p className="text-foreground/90 mb-4">I propose we turn our starting lineups into 9 offensive utility roles, which can be filled by QB/RB/WR/TE's. In this way, no two rosters will look the same, no two lineups will look the same, and draft day will be riveting in how each owner chooses to traverse up the mountain of fantasy success.</p>
                <p className="text-foreground/90">A team could start 9 QBs, 9RBs, or 9TEs. Rosters could be assembled in 126 different ways as opposed to its current 6.</p>
              </div>

              <div className="border-l-4 border-accent pl-4 mb-6">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Rule Change #2: The Abolishment of Head 2 Head</h3>
                <p className="text-foreground/90 mb-4">Weekly matchups are fun for trash-talk's sake, but little else. Weekly wins should be awarded to the top 50% of scorers, and losses to the bottom 50%. So in a 14 team league where the median score one week is 74, any team that scores above that gets a W and any team that scores below it gets an L. Luck is completely removed from the equation.</p>
                <p className="text-foreground/90">In this way, the end of the year standings will most accurately reflect the actual hierarchy of success. One argument against this is that it might be less fun of an experience, but I would rebut this. In fact, I think the enjoyment would increase, as rooting for your players would stay the same, while you only ever have to outperform the median. Sour grapes will cease to exist. Sure you might get an L by 0.5 points, but can you really complain if you were the 8th highest scorer in a league of 14? This rule change completely eliminates the rampant issue of 135–134 losses and 56–54 wins. At year's end, no one will be undeservingly seeded.</p>
              </div>

              <div className="border-l-4 border-gold pl-4 mb-6">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Rule Change #3: The Playoffs</h3>
                <p className="text-foreground/90 mb-4">Making the playoffs should be a privilege, not a right. I believe in a 12/14-team league, only 4 teams should make the playoffs. This is a proper nod to the results of the regular season, and makes every regular season week feel like a playoff in itself. If we implement our weekly W-L rule, there shouldn't be much complaining about 5–7 teams not making the playoffs. If you can't separate as one of the top 33% of teams over the course of 12–13 weeks, you don't deserve to contend for the title.</p>
                <p className="text-foreground/90 mb-4">In light of our regular season rule, the playoffs should honor this format, not spit in its face. It makes no sense to set our league up in this way, only to assign seeds for the playoffs and have the #1 seed lose to the #4 seed 150–151, and the #2 seed beat the #3 seed 75–74.</p>
                <p className="text-foreground/90">Remember the goal is to properly reward the most successful and strongest team at year's end. To do this, I propose four teams make the playoffs, which occur weeks 13–17, with each round taking two weeks. In the first round, all four teams compete against one another. The two highest scoring teams after two weeks advance to the finals. In the finals it becomes a true head-to-head. The highest scoring team after two weeks advances.</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">Rule Change #4: Keeper League</h3>
                <p className="text-foreground/90 mb-4">WHAT!? You heard me. Starting this year, we move to a keeper league. This means owners are allowed to carry over 3 players into the next year. We have a stable of 8–10 consistent players/friends/brothers in our league, so this won't be hard to do. We continue our European soccer model of relegating the worst team at year's end and adding in a new team every year. This team would be treated as an expansion team and get the #1 pick.</p>
                <p className="text-foreground/90 mb-4">Here's how the keeper league would work:</p>
                <ul className="list-disc pl-6 text-foreground/90 mb-4 space-y-2">
                  <li>At year's end, owners submit their three players to keep</li>
                  <li>Each of these players is given a value attached to where they were drafted, so if Antonio Brown is taken in the first round, that owner forgoes his #1 selection in the next draft and AB is slotted there.</li>
                  <li>Further, if a retained player is taken in the 10th round and kept for multiple years, his value doubles every year. His value is a 5th round pick the second season, and a 2nd round pick the third, and a first round pick the fourth.</li>
                </ul>
                <p className="text-foreground/90">Again, this rule works to increase the need for strategy in how a player assembles their team, and gives added weight to trades, a wrinkle I think will calm the nerves of conspiracy-phobic league owners who spend more time worrying about collusion than Neera Tanden and Robbie Mook.</p>
              </div>
            </div>

            {/* Miscellaneous Rules */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 mb-8">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Miscellaneous Rules</h2>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>There would be no regular season weekly tiebreakers, just ties.</li>
                <li>The #1 seed going into the playoffs is awarded $100, so as to properly honor the regular season champ.</li>
                <li>The champ at the end receives the rest of the pot.</li>
                <li>Tiebreakers for playoff seeding: most points for.</li>
                <li>Tiebreakers for playoff matchup ties: most points for.</li>
                <li>Continue with 1/2 PPR.</li>
              </ul>
            </div>

            {/* Conclusion */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 mb-8">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Conclusion</h2>
              <p className="text-foreground/90 mb-4">These proposed rule changes eliminate almost every persistent gripe with fantasy football. It would most certainly crown a proper champion at season's end. The only reasons one would be against what I have written thus far are:</p>
              <ul className="list-disc pl-6 text-foreground/90 mb-6 space-y-2">
                <li>I live rent-free in your head and if I discovered Penicillin you'd question its viability.</li>
                <li>You are against justice, knowing a fair fight would expose you for the fraud you are.</li>
                <li>You are afraid of change. You own a Nokia phone and play snake on it. You fax documents. You still own a Blockbuster rewards card. You hated SlamBall before its first game on SPIKE. You do weird things like go record-shopping on the weekend. You make a point to disparage young children who cannot tell time in analog.</li>
              </ul>
              <p className="text-foreground/90 font-semibold mb-4">Those are the only reasons.</p>
              <p className="text-foreground/90 mb-4">One legitimate follow-up question exists: how would such a radical format be implemented? This is a challenge, given ESPN's current league manager parameters. Rule #1 could be easily implemented.</p>
              <p className="text-foreground/90 mb-4">The head-to-head aspect would be tricky. As of now, the way ESPN is set up, I think we would have to have players play one another the same way we did this year, with one division and weekly head-to-heads, but as commissioner I would religiously update the league homepage to reflect current rankings within our system.</p>
              <p className="text-foreground/90 mb-4">So while ESPN might say Team A is 4–5, our actual standings on the homepage would reflect the 50/50 model, and give them a true 7–2 record on the homepage.</p>
              <p className="text-foreground/90 mb-4">After 13 weeks, the top four teams would be identified, and as LM I could edit the playoff matchups as necessary. The question then changes to a simpler one: as a grown-up adult, are you capable of ignoring the H2H results on our standings page, or will the competing standings irreparably damage your psyche?</p>
              <p className="text-foreground/90">Again, once the playoffs hit, I would alter the results after the fact to make sure the top two scoring teams advanced to the finals. Once the final matchup is set, ESPN will handle the rest.</p>
            </div>

            {/* Closing Quote */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-gold/10 to-accent/10 rounded-lg border border-gold/30 p-8 md:p-12 text-center"
            >
              <Quote className="mx-auto text-gold mb-4" size={36} />
              <p className="text-foreground/90 text-lg mb-4">It's a minor inconvenience for a major upgrade. This is the league I foresee.</p>
              <p className="text-foreground/90 text-lg mb-4">Yes, I'm still chasing that elusive ring, but just as much, I'm chasing a Utopian fantasy league where justice can be served. I believe this is the path.</p>
              <p className="font-display text-2xl font-bold text-accent mb-4">Welcome to Westworld.</p>
              <p className="text-muted-foreground font-semibold">— The Commish</p>
            </motion.div>
          </motion.article>
        </div>
      </section>
    </Layout>
  );
};

export default Manifesto;

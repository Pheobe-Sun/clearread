'use strict';

// Canned LLM-style answers for the ClearRead demo.
// Shape is fixed by AGENTS.md: { id, title, markdown, tldr }.
// Each markdown block is deliberately a dense "wall of text" so the
// Before/After contrast is honest. tldr is one plain sentence, <= 20 words.
window.CLEARREAD_DEMOS = [
  {
    id: 'vaccines',
    title: 'How do vaccines work?',
    tldr: 'Vaccines show your immune system a harmless preview of a germ so it can fight the real one fast.',
    markdown: `Vaccines work by training your immune system to recognize and fight a specific germ before you ever encounter the real, dangerous version of it. The core idea is exposure without illness: a vaccine introduces something that looks like a particular virus or bacterium to your body, but that cannot actually make you sick. This might be a weakened or inactivated form of the germ, a single characteristic protein from its surface, or, in the case of the newer mRNA vaccines, a set of genetic instructions that tell your own cells to briefly manufacture that harmless protein themselves. Your immune system encounters this material, treats it as a genuine threat, and mounts a full defensive response against it, all without the danger of the real disease.

When your immune system reacts, it does two things that matter enormously for the future. First, specialized white blood cells produce antibodies, which are proteins precisely shaped to latch onto the invading germ and neutralize it or flag it for destruction. Second, and this is the part that gives vaccines their lasting power, your body creates memory cells. These memory cells quietly persist for months, years, or in some cases a lifetime, carrying a detailed record of exactly what that germ looked like and how it was defeated. They are essentially a saved template of a successful battle plan, ready to be redeployed at a moment's notice.

If you are later exposed to the actual pathogen, these memory cells recognize it almost immediately and trigger a rapid, powerful counterattack, often destroying the invader before it can multiply enough to make you noticeably ill. This is why a vaccinated person may never develop symptoms, or may experience only a mild version of a disease that could otherwise be severe or even fatal. The response is faster and stronger than it would have been on a first encounter, because the immune system is no longer learning from scratch.

Vaccines also protect people beyond the individual who receives them, through a phenomenon called **herd immunity**. When a large enough share of a community is immune, the germ struggles to find susceptible hosts to jump between, so outbreaks fizzle out. This indirectly shields those who cannot be vaccinated themselves, such as newborns, people with certain allergies, or those with weakened immune systems undergoing treatments like chemotherapy. In this way, widespread vaccination turns individual protection into a shared communal defense, which is how diseases like smallpox were eradicated entirely and why others, such as polio and measles, have been pushed to the margins across much of the world.`
  },
  {
    id: 'compound-interest',
    title: 'Explain compound interest and why starting early matters',
    tldr: 'Your money earns money, then that earned money earns more, so early savers win on time, not amount.',
    markdown: `Compound interest is the process by which the money you earn on an investment or savings balance itself begins to earn money, creating a snowball effect that accelerates over time. It stands in contrast to simple interest, where you earn a fixed return only on your original deposit, known as the principal. With compounding, the interest you earn in one period is added to your principal, and the next period's interest is calculated on that new, larger total. Because each round of growth builds on top of all the growth that came before it, the balance does not rise in a straight line; it curves upward, gaining speed the longer it is left alone. This is why Albert Einstein is often, if perhaps apocryphally, said to have called it the eighth wonder of the world.

A concrete example makes the mechanism clear. Suppose you invest **£1,000** at an annual return of **10%**. After the first year you have £1,100, having earned £100. In the second year, however, you earn 10% not on £1,000 but on £1,100, which is £110, leaving you with £1,210. In the third year you earn £121, and so on. The yearly gains keep growing even though you have not added a single extra pound of your own money. Given enough time, this effect becomes genuinely dramatic: at a steady 10% return, a balance roughly doubles about every seven years, so a sum left untouched for several decades can grow many times over.

Starting early matters more than almost anything else, and often more than the amount you contribute, because compounding rewards time above all. The earliest pounds you invest have the most years to multiply, and those extra years at the beginning are the ones doing the heaviest lifting. Consider the difference a head start makes:

- A saver who invests **£200 a month from age 25 to 35** and then stops completely often ends up with more at retirement than someone who invests the same £200 a month **from age 35 all the way to 65**.
- The early saver contributed for only ten years; the late saver contributed for thirty, yet the early money simply had more time to compound.
- Waiting even a handful of years in your twenties can cost you a large share of your eventual balance, because you permanently lose the most valuable compounding periods.

The practical lesson is straightforward but powerful. To harness compound interest, you should start as soon as you reasonably can, contribute consistently, reinvest your returns rather than withdrawing them, and be patient enough to let the curve do its work over the long run. Time in the market, not the timing of the market, is what turns modest, regular saving into meaningful wealth.`
  },
  {
    id: 'sourdough',
    title: 'How do I make a sourdough starter from scratch?',
    tldr: 'Mix flour and water daily for about a week until wild yeast makes it bubbly and doubling.',
    markdown: `Making a sourdough starter from scratch is essentially the process of cultivating a stable colony of wild yeast and beneficial bacteria in a simple mixture of flour and water, and it requires nothing more than those two ingredients, a jar, and about a week of patience. The wild yeast that will eventually leaven your bread is already present on the flour and floating in the air around you, so you are not adding it from a packet; you are simply creating an environment where it can wake up, feed, and multiply until it becomes strong and predictable enough to raise a loaf. The whole endeavour is a small act of domestication, coaxing invisible microbes into a reliable partnership.

To begin, take a clean jar and combine roughly fifty grams of flour with fifty grams of lukewarm water, stirring until no dry flour remains and the mixture has the consistency of a thick paste. Wholemeal or rye flour tends to kick-start the culture faster because it carries more wild microbes and minerals, though plain white flour will work perfectly well with a little more time. Cover the jar loosely, so that gases can escape but debris cannot fall in, and leave it somewhere reasonably warm, ideally around twenty to twenty-five degrees Celsius. Then simply wait, resisting the urge to interfere, because the first day is mostly about letting the dormant organisms sense moisture and begin to stir.

Each day thereafter you will feed the starter, which means discarding about half of the mixture and stirring in another fifty grams each of fresh flour and water. This discarding step feels wasteful and frustrates many beginners, but it is essential: it keeps the volume manageable and, more importantly, it keeps the food-to-microbe ratio high enough for the culture to stay vigorous rather than starving in its own acidic waste. Over the first few days you may see early bubbles and catch a sharp, slightly unpleasant smell, which is normal and usually reflects a temporary bloom of the wrong bacteria that will soon be crowded out as the healthy culture establishes itself and the aroma turns pleasantly sour and yeasty.

By somewhere between day five and day ten, a healthy starter should roughly double in volume within four to eight hours of being fed, be riddled with bubbles throughout, and smell tangy and faintly of ripe fruit or beer rather than of anything rotten. A reliable test is to drop a small spoonful into a glass of water; if it floats, the starter is full enough of gas to leaven bread and is ready to bake with. Once it reaches this active, predictable state you can keep it on the counter with daily feedings if you bake often, or move it to the refrigerator and feed it just once a week, waking it up with a feeding or two before each bake.`
  }
];

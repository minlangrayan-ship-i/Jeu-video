export const PLACES = {
  home: { name: 'Willow House', label: 'La maison', type: 'HOME', x: -12, z: 9, color: '#e5b59a', npc: 'Jamie', role: 'Votre colocataire', avatar: 'J', tone: '#e4a17e' },
  cafe: { name: 'The Daily Grind', label: 'Le café', type: 'COFFEE', x: -11, z: -9, color: '#e6c67c', npc: 'Ruby', role: 'Barista & première amie', avatar: 'R', tone: '#eebc73' },
  market: { name: 'Green & Good', label: 'Le marché', type: 'MARKET', x: 0, z: -13, color: '#a5bd99', npc: 'Oliver', role: 'Le commerçant du quartier', avatar: 'O', tone: '#acc3a3' },
  work: { name: 'Studio North', label: 'Le travail', type: 'STUDIO', x: 11, z: -8, color: '#b4c1d0', npc: 'Alex', role: 'Votre collègue au studio', avatar: 'A', tone: '#a3b6d1' },
  park: { name: 'Meadow Park', label: 'Le parc', type: 'PARK', x: 12, z: 9, color: '#8cb28b', npc: 'Sam', role: 'Votre voisin, toujours en mouvement', avatar: 'S', tone: '#9dbb90' },
  books: { name: 'Little Chapters', label: 'La librairie', type: 'BOOKS', x: 0, z: 11, color: '#cc9b9c', npc: 'Grace', role: 'Libraire & curieuse de tout', avatar: 'G', tone: '#cc9b9c' },
};

// Each scene has an explicit communication goal, a contextual prompt,
// one suitable reply, two distractors and a teaching explanation.
const raw = [
 ['First things first', 'Prendre ses marques', [
  ['home', 'Présentez-vous à votre colocataire.', 'Hi! I’m Jamie. What’s your name?', 'Hi, I’m Charlie. Nice to meet you!', 'I’m from Manchester.', 'I live next door.', '« I’m… » sert à se présenter. « Nice to meet you » accompagne une première rencontre.'],
  ['cafe', 'Commandez un thé, poliment.', 'Morning! What can I get you?', 'A tea, please.', 'The bill, please.', 'No thanks, I’ve already eaten.', '« …, please » transforme une commande courte en demande polie.'],
  ['park', 'Dites que vous découvrez le quartier.', 'Hello! Do you live around here?', 'Yes, I’ve just moved here.', 'I’m only visiting for the afternoon.', 'I live in another town.', '« I’ve just moved here » indique un déménagement très récent.'],
 ]],
 ['A little routine', 'Installer sa routine', [
  ['home', 'Dites que vous prenez votre petit-déjeuner à huit heures.', 'What time do you have breakfast?', 'I have breakfast at eight.', 'I finish work at eight.', 'Breakfast is in the kitchen.', 'On emploie « at » devant une heure : at eight, at half past nine.'],
  ['cafe', 'Demandez un café à emporter.', 'Is that to have here or to take away?', 'To take away, please.', 'I’ll have it here, please.', 'A table for two, please.', 'Au Royaume-Uni, « take away » signifie à emporter.'],
  ['work', 'Dites que vous commencez à neuf heures.', 'What time do you start work?', 'I start at nine in the morning.', 'I finish at nine in the evening.', 'I work at Studio North.', 'Le présent simple décrit les routines : I start, I work, I finish.'],
 ]],
 ['Rain or shine', 'Parler du temps', [
  ['home', 'Décrivez le temps pluvieux.', 'What’s the weather like outside?', 'It’s raining. I’ll take an umbrella.', 'It was sunny yesterday.', 'I usually like warm weather.', '« It’s raining » décrit une pluie en cours. « It » sert de sujet pour la météo.'],
  ['cafe', 'Demandez une boisson chaude parce que vous avez froid.', 'You look cold! What would you like?', 'Could I have a hot chocolate, please?', 'Could I have an iced coffee, please?', 'Could you open the window?', '« Could I have…? » est une manière polie de commander.'],
  ['park', 'Proposez une promenade demain si le temps le permet.', 'Shall we go for a walk today?', 'Let’s go tomorrow if it’s sunny.', 'Let’s go outside right now.', 'I went for a walk yesterday.', '« Let’s… » permet de proposer une activité.'],
 ]],
 ['Around the corner', 'Trouver son chemin', [
  ['cafe', 'Demandez où se trouve la librairie.', 'Hi! You look a bit lost.', 'Excuse me, where is the bookshop?', 'How much is this coffee?', 'What time does the bookshop close?', '« Excuse me » attire poliment l’attention avant une question.'],
  ['books', 'Vérifiez si le parc est à gauche.', 'The park is just around the corner.', 'Is it on the left?', 'Is it open on Sundays?', 'Is it far from the station?', '« On the left / on the right » situe quelque chose à gauche ou à droite.'],
  ['home', 'Expliquez que la maison est près du café.', 'How do I find your house?', 'It’s near the café, opposite the park.', 'The café closes at five.', 'I moved here last week.', '« Near » indique la proximité ; « opposite » veut dire en face.'],
 ]],
 ['Something delicious', 'Manger selon ses goûts', [
  ['cafe', 'Dites que vous souhaitez un repas végétarien.', 'Would you like the chicken sandwich?', 'Do you have a vegetarian option?', 'Yes, the chicken one, please.', 'Could I have extra chicken?', '« Do you have…? » sert à vérifier ce qui est disponible.'],
  ['market', 'Achetez trois pommes.', 'How many apples would you like?', 'Three apples, please.', 'Just one apple, please.', 'Three oranges, please.', 'Après « three », le nom dénombrable prend le pluriel : apples.'],
  ['home', 'Exprimez votre préférence pour les pâtes.', 'Shall we have rice or pasta tonight?', 'I’d prefer pasta, if that’s okay.', 'Rice would be lovely.', 'I had pasta yesterday.', '« I’d prefer… » exprime une préférence dans cette situation.'],
 ]],
 ['Market morning', 'Acheter et comparer', [
  ['market', 'Demandez le prix des tomates.', 'These tomatoes are lovely today.', 'How much are the tomatoes?', 'How many tomatoes do you have?', 'Where are these tomatoes from?', '« How much…? » demande un prix ou une quantité non dénombrable.'],
  ['cafe', 'Demandez à payer par carte.', 'That’s four pounds fifty, please.', 'Can I pay by card?', 'I’ll pay in cash, please.', 'Could I have a receipt?', 'On dit « by card » et « in cash » pour les moyens de paiement.'],
  ['books', 'Demandez une option moins chère.', 'This notebook is twelve pounds.', 'Do you have a cheaper one?', 'Do you have a larger one?', 'Could you gift-wrap it?', '« Cheaper » est le comparatif de « cheap » : moins cher.'],
 ]],
 ['Sunday stories', 'Raconter sa première semaine', [
  ['home', 'Dites que votre semaine s’est bien passée.', 'How was your first week here?', 'It was great. Everyone was friendly.', 'I’m looking forward to next week.', 'I usually work on Mondays.', '« Was » est le passé de « is » : it was great.'],
  ['park', 'Racontez votre visite au marché.', 'What did you do yesterday?', 'I went to the market and bought some fruit.', 'I’m going to the market tomorrow.', 'I go shopping every Saturday.', '« Went » et « bought » sont les passés irréguliers de go et buy.'],
  ['cafe', 'Proposez de revenir la semaine prochaine.', 'It was lovely seeing you this week.', 'See you next week!', 'See you yesterday!', 'I saw you last week.', '« Next week » désigne la semaine prochaine, sans préposition.'],
 ]],
 ['Meet the team', 'Se présenter au travail', [
  ['work', 'Présentez votre rôle au studio.', 'Welcome! What do you do?', 'I’m a junior designer. It’s my first day.', 'I take the bus to work.', 'I start work at nine.', '« What do you do? » demande généralement le métier.'],
  ['cafe', 'Expliquez où vous travaillez.', 'Are you working nearby?', 'Yes, I work at Studio North.', 'Yes, I live near the park.', 'Yes, the studio is closed today.', 'Pour un lieu de travail précis, on peut dire « work at ».'],
  ['home', 'Dites que votre équipe est accueillante.', 'How are your new colleagues?', 'They’re really welcoming and helpful.', 'The office opens at nine.', 'I’m still looking for a job.', '« They’re » est la contraction de « they are ».'],
 ]],
 ['Could you help?', 'Demander de l’aide', [
  ['work', 'Demandez comment utiliser l’imprimante.', 'Do you need a hand?', 'Yes, could you show me how to use the printer?', 'Yes, could you send this email for me?', 'Yes, could you book a meeting room?', '« Could you show me how to…? » permet de demander une démonstration.'],
  ['books', 'Demandez de répéter plus lentement.', 'The reading group meets fortnightly on Thursdays.', 'Sorry, could you say that more slowly?', 'Yes, I know exactly what you mean.', 'Could you say that more quickly?', 'Demander une reformulation est une vraie compétence de communication.'],
  ['home', 'Remerciez votre colocataire pour son aide.', 'I’ve fixed the kitchen light for you.', 'Thanks so much. That’s really helpful.', 'Could you fix the bathroom light as well?', 'I’ll turn the light off now.', '« That’s really helpful » explique pourquoi vous remerciez quelqu’un.'],
 ]],
 ['Make some plans', 'Organiser son temps', [
  ['work', 'Proposez une réunion à dix heures.', 'When are you free for a quick chat?', 'Would ten o’clock work for you?', 'I was free yesterday at ten.', 'The meeting room is upstairs.', '« Would … work for you? » vérifie si un horaire convient.'],
  ['park', 'Vérifiez l’heure du rendez-vous.', 'Let’s meet at half past seven.', 'So, seven thirty?', 'So, six thirty?', 'So, seven fifteen?', '« Half past seven » signifie 7 h 30 au Royaume-Uni.'],
  ['home', 'Dites que vous serez en retard de dix minutes.', 'Are you nearly home?', 'I’m running about ten minutes late.', 'I’ll be home ten minutes early.', 'I left home ten minutes ago.', '« I’m running late » veut dire « je suis en retard ».'],
 ]],
 ['Small talk, big steps', 'Faire connaissance', [
  ['cafe', 'Demandez d’où vient Ruby.', 'I’ve lived here for about five years.', 'Where did you live before that?', 'Where do you live now?', 'How old were you five years ago?', 'Après « did », le verbe revient à sa forme de base : did you live.'],
  ['park', 'Parlez de votre loisir : la photographie.', 'What do you enjoy doing in your spare time?', 'I enjoy taking photos around town.', 'I’m working late this week.', 'I worked in a photography shop.', 'Après « enjoy », on emploie une forme en -ing.'],
  ['books', 'Posez une question sur les goûts de lecture.', 'I love a good mystery novel.', 'Who’s your favourite author?', 'How much does this novel cost?', 'What time does the reading group meet?', 'Une question liée à ce que dit l’autre aide à faire vivre la conversation.'],
 ]],
 ['Your lunch break', 'Commander avec précision', [
  ['cafe', 'Commandez sans lait.', 'Would you like milk in your coffee?', 'No milk for me, thanks.', 'Just a little milk, please.', 'Extra milk would be lovely.', '« For me » précise votre propre commande dans un groupe.'],
  ['market', 'Demandez si le plat contient des noix.', 'Would you like to try this salad?', 'Does it contain any nuts?', 'How much does the salad cost?', 'Could I have a larger portion?', '« Does it contain…? » permet de vérifier les ingrédients.'],
  ['work', 'Invitez votre collègue à déjeuner.', 'I could do with a break.', 'Shall we grab some lunch together?', 'I had lunch an hour ago.', 'Could you finish this before lunch?', '« Grab some lunch » est une expression courante pour aller déjeuner.'],
 ]],
 ['Out of office', 'Découvrir les loisirs', [
  ['park', 'Proposez de courir samedi.', 'I’m trying to get a bit more exercise.', 'Would you like to go for a run on Saturday?', 'Would you like to watch a film on Saturday?', 'I went for a run last Saturday.', 'On dit « on Saturday » et « go for a run ».'],
  ['books', 'Demandez s’il reste des places pour un atelier.', 'We have a writing workshop this weekend.', 'Are there any places left?', 'How long does the workshop last?', 'Who’s leading the workshop?', '« Places left » désigne les places encore disponibles.'],
  ['home', 'Dites que vous préférez vous reposer ce soir.', 'Fancy going out tonight?', 'I’d rather have a quiet evening at home.', 'Let’s go dancing tonight.', 'I’d love to go to the cinema.', '« I’d rather + verbe » exprime ce que vous préféreriez faire.'],
 ]],
 ['Two weeks in', 'Faire le point', [
  ['work', 'Dites ce que vous avez appris.', 'How are you finding your first two weeks?', 'I’ve learned a lot, but I still need some practice.', 'I’ll start here next month.', 'My last job was in another city.', '« I’ve learned » relie ce que vous avez appris à votre situation actuelle.'],
  ['cafe', 'Comparez votre aisance avec le premier jour.', 'You seem more confident now!', 'Ordering feels easier than it did before.', 'Ordering was easier on my first day.', 'I don’t think I’ll ever order again.', '« Easier than » permet de comparer deux situations.'],
  ['home', 'Formulez votre objectif pour la semaine suivante.', 'What would you like to work on next?', 'I’d like to understand people more easily.', 'I improved my English last week.', 'I used to work on Thursdays.', '« I’d like to + verbe » exprime un souhait ou un objectif.'],
 ]],
 ['A change of plans', 'Gérer un imprévu', [
  ['work', 'Prévenez que votre bus est en retard.', 'Are you on your way to the meeting?', 'Yes, but my bus is delayed. I’ll be there soon.', 'My bus arrived early, so I’m already there.', 'I’m not coming to the meeting at all.', '« I’ll » est la forme courte de « I will », utile pour une action à venir.'],
  ['cafe', 'Acceptez une autre boisson.', 'Sorry, we’ve run out of oat milk.', 'That’s okay. I’ll have a black coffee instead.', 'I’ll wait for an oat milk coffee anyway.', 'I ordered this coffee yesterday.', '« Instead » signifie « à la place ». « Run out of » : ne plus avoir de stock.'],
  ['park', 'Proposez une activité à l’intérieur à cause de la pluie.', 'Our picnic might get rained off.', 'Why don’t we go to the bookshop instead?', 'Let’s have the picnic outside in the rain.', 'We had a lovely picnic last weekend.', '« Why don’t we…? » est une manière naturelle de faire une suggestion.'],
 ]],
 ['Feeling at home', 'Parler de son logement', [
  ['home', 'Signalez que le chauffage ne fonctionne pas.', 'Is everything okay with the flat?', 'The heating isn’t working. Could we get it checked?', 'The flat is close to the station.', 'I’d like to paint the bedroom blue.', 'Décrire le problème puis proposer une action rend la demande plus claire.'],
  ['market', 'Demandez une plante facile à entretenir.', 'What sort of plant are you after?', 'Something easy to look after, please.', 'Something that needs watering every hour.', 'Do you have any cut flowers instead?', '« Look after » signifie prendre soin de quelqu’un ou de quelque chose.'],
  ['home', 'Proposez de partager les tâches.', 'The kitchen could do with a clean.', 'I’ll do the dishes if you wipe the table.', 'You should do all the cleaning yourself.', 'The kitchen looked nice yesterday.', '« I’ll … if you … » propose un partage concret des tâches.'],
 ]],
 ['A friendly invitation', 'Inviter et répondre', [
  ['cafe', 'Invitez Ruby à votre dîner vendredi.', 'Have you got any plans for Friday?', 'I’m having a few friends over. Would you like to come?', 'I had a dinner party last Friday.', 'Are you free next month?', '« Have people over » signifie recevoir des gens chez soi.'],
  ['market', 'Précisez que vous cuisinez pour quatre personnes.', 'How many people are you cooking for?', 'Four, including me. What would you recommend?', 'Four guests, plus me, so five in total.', 'I’m cooking at four o’clock.', '« Including me » précise que vous faites partie du nombre annoncé.'],
  ['home', 'Acceptez l’aide pour préparer le dîner.', 'Can I give you a hand with dinner?', 'That would be lovely. Could you chop the vegetables?', 'No, I’ll do everything on my own.', 'Did you enjoy dinner yesterday?', '« That would be lovely » accepte chaleureusement une proposition.'],
 ]],
 ['Keep in touch', 'Échanger des messages', [
  ['park', 'Demandez à Sam de vous écrire l’adresse.', 'The running club meets near the old bridge.', 'Could you text me the address?', 'Could you tell me about the running club?', 'Could you move the meeting to tomorrow?', '« Text someone » signifie envoyer un SMS à quelqu’un.'],
  ['work', 'Confirmez la réception d’un document.', 'Did you get the file I sent over?', 'Yes, thanks. I’ll have a look this afternoon.', 'No, could you send it again?', 'I sent you a different file last week.', '« Have a look » signifie jeter un œil ou examiner quelque chose.'],
  ['home', 'Demandez une précision sur un message.', 'Ruby says she’ll pop round later.', 'Does she mean this afternoon or this evening?', 'Is Ruby bringing someone with her?', 'Does Ruby live near the park?', '« Pop round » est une visite brève et informelle, surtout en anglais britannique.'],
 ]],
 ['Say what you think', 'Exprimer un avis', [
  ['books', 'Expliquez pourquoi un livre vous plaît.', 'What did you think of the story?', 'I liked it because the characters felt real.', 'I haven’t read it yet.', 'It costs more than the other books.', '« Because » permet de justifier votre opinion.'],
  ['work', 'Proposez une amélioration avec tact.', 'What do you think of this design?', 'It’s a good start. Perhaps we could simplify the colours.', 'It’s terrible. Start again.', 'You must keep every colour exactly as it is.', '« Perhaps we could… » adoucit une suggestion.'],
  ['cafe', 'Exprimez un désaccord poli sur un film.', 'That was the best film of the year!', 'I can see why you liked it, but I found it a bit slow.', 'No, that’s a stupid opinion.', 'Yes, it was absolutely perfect.', 'Reconnaître le point de vue de l’autre facilite un désaccord respectueux.'],
 ]],
 ['Look after yourself', 'Parler de son bien-être', [
  ['home', 'Dites que vous avez mal à la tête.', 'You seem a bit quiet. Are you okay?', 'I’ve got a headache. I think I need some rest.', 'I’m planning a busy night out.', 'My neighbour has a headache.', '« I’ve got a headache » décrit un mal de tête.'],
  ['park', 'Expliquez que vous reprenez doucement le sport.', 'Shall we do another lap?', 'I’d like to take it slowly today.', 'Let’s run as fast as we can.', 'I went running last month.', '« Take it slowly » signifie y aller doucement.'],
  ['work', 'Demandez une pause.', 'Can you finish this before lunch?', 'I can, but could I take a short break first?', 'I’ll work all afternoon without stopping.', 'Could you finish it for me instead?', 'Vous pouvez exprimer une limite tout en répondant à la demande.'],
 ]],
 ['Three weeks of stories', 'Raconter une expérience', [
  ['cafe', 'Racontez une rencontre récente.', 'Anything interesting happen this week?', 'I met someone at the running club and we became friends.', 'I’m hoping to join a club next month.', 'I usually meet people on Saturdays.', '« Met » et « became » sont les passés de meet et become.'],
  ['books', 'Décrivez une surprise.', 'Was the writing workshop what you expected?', 'Actually, it was much more fun than I expected.', 'It was much more boring than I expected.', 'The workshop starts next Thursday.', '« Actually » signifie « en fait », et non « actuellement ».'],
  ['home', 'Dites ce qui vous manque de chez vous.', 'Is there anything you miss about home?', 'I miss cooking with my family, especially on Sundays.', 'I’ll move into a new flat next year.', 'I enjoy living near the café.', 'Après « miss », on peut employer un nom ou une forme en -ing.'],
 ]],
 ['Money matters', 'Parler de son budget', [
  ['market', 'Expliquez que vous avez un budget limité.', 'Would you like the bigger basket?', 'I’m trying to stick to a budget this week.', 'Yes, I’d like the most expensive one.', 'I’m planning to buy everything here.', '« Stick to a budget » signifie respecter un budget.'],
  ['cafe', 'Proposez de partager l’addition.', 'Shall I get this?', 'How about we split the bill?', 'Thanks, you can pay for everything.', 'I paid my rent yesterday.', '« Split the bill » signifie partager l’addition.'],
  ['home', 'Demandez si les charges sont comprises.', 'The rent is six hundred pounds a month.', 'Does that include the bills?', 'Can I pay the rent on Friday?', 'How far is the flat from the station?', 'Après « does », le verbe reste à l’infinitif sans « to » : include.'],
 ]],
 ['Make it happen', 'Proposer un petit projet', [
  ['work', 'Présentez une idée de projet.', 'Do you have any ideas for the neighbourhood event?', 'We could make a small guide to the local shops.', 'We made a guide for last year’s event.', 'I don’t have time to think about it.', 'Après « could », le verbe est à sa forme de base.'],
  ['books', 'Demandez l’avis de Grace.', 'A neighbourhood guide sounds interesting.', 'What would you include in it?', 'It’ll be finished tomorrow.', 'I’ll include whatever I want.', 'Une question ouverte invite l’autre à contribuer au projet.'],
  ['cafe', 'Proposez une tâche précise.', 'I’d love to help with the guide.', 'Could you write a short introduction to the café?', 'Could you close the café early?', 'Could you lend me your camera instead?', 'Une demande précise facilite la collaboration.'],
 ]],
 ['When things go wrong', 'Résoudre un malentendu', [
  ['cafe', 'Signalez poliment une erreur de commande.', 'Here’s your cappuccino!', 'Sorry, I ordered a tea. Could you change it, please?', 'Thanks, this cappuccino is exactly what I ordered.', 'I’ve changed my mind; I don’t want a drink.', 'Expliquez ce qui était attendu puis demandez une correction.'],
  ['work', 'Reconnaissez un malentendu sur une date.', 'I thought you were sending it today.', 'Sorry, I misunderstood. I thought you meant Friday.', 'You’re wrong. I never make mistakes.', 'I’m sending it next month, whatever you said.', '« I misunderstood » assume un malentendu sans chercher un responsable.'],
  ['home', 'Cherchez une solution au bruit.', 'I didn’t realise my music was keeping you up.', 'Could we agree on a quieter time after ten?', 'You should stop listening to music forever.', 'I’ll just make more noise myself.', '« Could we agree on…? » aide à construire une solution commune.'],
 ]],
 ['British little things', 'Comprendre les expressions', [
  ['cafe', 'Répondez à une salutation informelle.', 'You alright?', 'Yeah, good thanks! How about you?', 'Only on my right-hand side.', 'I’m going to turn right here.', 'Au Royaume-Uni, « You alright? » sert souvent de simple salutation.'],
  ['park', 'Comprenez une invitation informelle.', 'Fancy a cuppa after our walk?', 'A cup of tea sounds lovely, thanks.', 'No, I don’t like wearing fancy clothes.', 'I’ve never tried walking in a cup.', '« A cuppa » est une tasse de thé ; « fancy…? » signifie « ça te dit…? ».'],
  ['books', 'Répondez à un remerciement informel.', 'Cheers for helping with the display!', 'No problem. Happy to help!', 'I haven’t ordered a drink.', 'The display is closed on Fridays.', '« Cheers » peut aussi vouloir dire « merci », selon le contexte.'],
 ]],
 ['A proper weekend', 'Organiser une sortie', [
  ['park', 'Proposez deux options de sortie.', 'What shall we do this weekend?', 'We could go for a hike or visit the museum.', 'We went hiking last weekend.', 'The museum is next to the station.', 'Proposer deux options aide à organiser une sortie ensemble.'],
  ['market', 'Vérifiez les horaires du dimanche.', 'We’re open most days.', 'What time do you close on Sundays?', 'How long have you been open?', 'What time do you open on Saturdays?', 'Pour une habitude, on emploie le présent simple et « on Sundays ».'],
  ['home', 'Expliquez votre plan de repli.', 'What if the weather’s bad?', 'If it rains, we’ll visit the museum instead.', 'We visited the museum last year.', 'I don’t like the weather today.', 'Pour une possibilité future : if + présent, puis will + verbe.'],
 ]],
 ['Tell your story', 'Présenter son parcours', [
  ['work', 'Expliquez pourquoi vous êtes venu ici.', 'What brought you to this town?', 'I wanted a fresh start and a chance to improve my English.', 'I usually take the bus into town.', 'I’m leaving town this afternoon.', '« A fresh start » signifie un nouveau départ.'],
  ['books', 'Décrivez ce qui a changé depuis votre arrivée.', 'Do you feel different from when you arrived?', 'I’m more independent now, and I’m less afraid to ask questions.', 'I arrived on the first of June.', 'My first room was near the café.', 'Les comparatifs permettent de décrire votre évolution.'],
  ['home', 'Évoquez une difficulté et votre réponse.', 'What’s been the hardest part?', 'Understanding fast speech was hard, so I asked people to repeat.', 'I’m planning to speak more next month.', 'Everyone here lives near the park.', '« So » relie une difficulté à la réaction qu’elle entraîne.'],
 ]],
 ['Let’s build together', 'Collaborer avec confiance', [
  ['work', 'Répartissez les tâches du projet.', 'How should we divide up the work?', 'I’ll handle the pictures if you can write the text.', 'You can do everything on your own.', 'I finished all of it last week.', '« Handle » signifie s’occuper de quelque chose.'],
  ['cafe', 'Demandez un retour précis.', 'I’ve read the first draft of the guide.', 'Is there anything you think we should change?', 'Great, there’s no need to change anything.', 'Could you send me next month’s timetable?', 'Demander un retour ciblé aide à améliorer un travail.'],
  ['books', 'Annoncez un délai réaliste.', 'When do you think it’ll be ready?', 'We should have it ready by Thursday afternoon.', 'We finished it last Thursday.', 'We should had it ready by Thursday.', '« By Thursday » signifie au plus tard jeudi.'],
 ]],
 ['Part of the neighbourhood', 'Prendre sa place', [
  ['park', 'Proposez votre aide pour un événement.', 'We still need a few volunteers for Saturday.', 'I’m happy to help. What needs doing?', 'I volunteered last year, so I won’t help now.', 'You should cancel the whole event.', '« What needs doing? » demande ce qu’il reste à faire.'],
  ['market', 'Présentez deux personnes.', 'I don’t think we’ve met before.', 'Oliver, this is Sam. We met at the running club.', 'Sam, Oliver already left for the day.', 'Oliver, I’ve never met Sam before.', 'Présenter quelqu’un et donner un lien commun facilite la rencontre.'],
  ['home', 'Exprimez votre sentiment d’appartenance.', 'You seem really settled in now.', 'I do feel at home here. I’ve made some lovely friends.', 'I’m leaving because I don’t feel welcome.', 'I haven’t met anyone in the neighbourhood.', '« Feel at home » signifie se sentir chez soi, même ailleurs.'],
 ]],
 ['Your next chapter', 'Ouvrir la suite', [
  ['cafe', 'Évoquez votre premier jour et votre évolution.', 'Remember your first visit? How do you feel now?', 'I was nervous then. Now I can order and chat without worrying so much.', 'I ordered a tea on my first day.', 'The café is open until five.', 'Comparer « then » et « now » permet de raconter une progression.'],
  ['work', 'Définissez votre prochain objectif.', 'What would you like to do next month?', 'I’d like to lead a small project and keep improving my English.', 'I led a project last month.', 'I stopped practising English a year ago.', 'Un objectif concret donne une direction à la suite de votre apprentissage.'],
  ['home', 'Célébrez ce parcours et proposez une suite.', 'Thirty days already! What shall we do to celebrate?', 'Let’s have dinner with everyone. This is just the beginning!', 'We had dinner together last Sunday.', 'I celebrated before I moved here.', 'Vous savez maintenant proposer, expliquer, raconter et créer du lien. Continuez dans d’autres contextes !'],
 ]],
];

export const DAYS = raw.map(([title, subtitle, scenes], i) => ({
  id: i + 1, title, subtitle,
  weather: ['sun', 'cloud', 'rain', 'sun', 'cloud', 'sun', 'sun', 'cloud', 'rain', 'sun'][i % 10],
  temperature: [18, 16, 13, 19, 17, 20, 18, 16, 14, 19][i % 10],
  scenes: scenes.map(([place, goal, prompt, answer, wrong1, wrong2, tip], j) => ({
    id: `${i + 1}-${j}`, place, goal, prompt, answer, wrong: [wrong1, wrong2], tip,
    period: ['Morning', 'Afternoon', 'Evening'][j],
    time: ['08:30', '13:00', '18:30'][j],
  })),
}));

export const WEATHER = {
 sun: { label: 'Sunny spells', french: 'Éclaircies', icon: 'sun' },
 cloud: { label: 'A little cloudy', french: 'Nuageux', icon: 'cloud' },
 rain: { label: 'A rainy day', french: 'Pluie légère', icon: 'rain' },
};

export const ACTIVITIES = {
  home: {title:'A slow start',label:'Préparer son petit-déjeuner',prompt:'The kettle is on. What would you like for breakfast?',choices:['Toast and a cup of tea','Porridge with berries','Eggs and a glass of water'],reply:'You make breakfast and take a quiet moment before heading out.',phrase:'The kettle is on.',meaning:'La bouilloire est en marche.',pose:'eat'},
  cafe: {title:'A table for one',label:'Faire une pause au café',prompt:'Take a seat by the window. What would you like to have?',choices:['A bowl of soup with bread','A vegetarian sandwich','A slice of cake and a tea'],reply:'You enjoy your food by the window and watch the neighbourhood go by.',phrase:'Take a seat by the window.',meaning:'Installez-vous près de la fenêtre.',pose:'eat'},
  market: {title:'A little shopping',label:'Faire ses courses',prompt:'Pick something fresh to take home. What goes in your bag?',choices:['A bunch of bananas','A loaf of bread','A punnet of strawberries'],reply:'You pay for your shopping and put it in your bag. Dinner is looking good.',phrase:'A loaf of bread.',meaning:'Un pain. « Loaf » désigne un pain entier.',pose:'shop'},
  work: {title:'A fresh pair of eyes',label:'Se mettre au travail',prompt:'You have a little time before your next meeting. Where will you start?',choices:['Sketch a new idea','Read through the project notes','Organise the team’s task list'],reply:'You settle at your desk and make a little progress on the neighbourhood guide.',phrase:'A fresh pair of eyes.',meaning:'Un regard neuf sur quelque chose.',pose:'work'},
  park: {title:'A breath of fresh air',label:'Bouger au grand air',prompt:'The park is yours for a little while. What do you fancy?',choices:['A gentle jog around the park','A stretch under the trees','A quiet walk by the pond'],reply:'You take a little time outdoors. The rest of the day can wait a moment.',phrase:'What do you fancy?',meaning:'Qu’est-ce qui vous tente ?',pose:'exercise'},
  books: {title:'Just one more page',label:'Lire quelques pages',prompt:'Grace has left three books on the reading table. Which one catches your eye?',choices:['A mystery set in a seaside town','A collection of travel stories','A little book of British recipes'],reply:'You read a few pages, take your time with new words and enjoy the story.',phrase:'Which one catches your eye?',meaning:'Lequel attire votre attention ?',pose:'read'},
};

export function weekFor(day) { return Math.ceil(day / 7); }
export function dateFor(day) {
  return new Date(Date.UTC(2026, 5, day)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}
export function getDay(id) { return DAYS[Math.max(0, Math.min(29, id - 1))]; }

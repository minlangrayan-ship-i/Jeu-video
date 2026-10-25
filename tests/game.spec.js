import { test, expect } from '@playwright/test';
import { DAYS, PLACES, dateFor } from '../src/content.js';
import { readState, progress } from '../src/state.js';

test('30 complete days contain 90 contextual, distinct and reachable situations', () => {
  expect(DAYS).toHaveLength(30);
  const ids = new Set();
  for (const day of DAYS) {
    expect(day.scenes).toHaveLength(3);
    expect(dateFor(day.id)).not.toContain('Invalid');
    for (const scene of day.scenes) {
      expect(PLACES[scene.place]).toBeTruthy();
      expect(scene.prompt.length).toBeGreaterThan(8);
      expect(scene.goal.length).toBeGreaterThan(10);
      expect(scene.tip.length).toBeGreaterThan(25);
      expect(new Set([scene.answer, ...scene.wrong]).size).toBe(3);
      expect(ids.has(scene.id)).toBe(false);
      ids.add(scene.id);
    }
  }
  expect(ids.size).toBe(90);
  const malformed = readState({ getItem: () => '{broken' });
  expect(malformed.day).toBe(1);
  expect(progress(malformed).percent).toBe(0);
  const invalid = readState({getItem: () => JSON.stringify({version:1,day:1000,scene:-1,completed:null})});
  expect(invalid.day).toBe(30);
  expect(invalid.scene).toBe(0);
  expect(invalid.completed).toEqual([]);
});

test('desktop: 3D, real travel, feedback, notebook, progression and persistence', async ({ page }) => {
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Une nouvelle vie. In English.'})).toBeVisible();
  await page.locator('#player-name').fill('Charlie');
  await page.getByRole('button',{name:'Entrer dans Harbour'}).click();
  await expect(page.locator('body')).toHaveClass(/world-ready/);
  expect(await page.locator('#world').evaluate(c => !!c.getContext('webgl2'))).toBe(true);
  await page.screenshot({path:'/tmp/hello-harbour-desktop.png'});
  await page.getByRole('button',{name:'Rejoindre Jamie'}).click();
  await expect(page.getByText('Hi! I’m Jamie. What’s your name?',{exact:true})).toBeVisible();
  await page.locator('[data-action="answer"][data-correct="false"]').first().click();
  await expect(page.getByText('Try another way.')).toBeVisible();
  await page.locator('[data-action="answer"][data-correct="true"]').click();
  await expect(page.getByText('You’ve got it!')).toBeVisible();
  await page.getByRole('button',{name:'Garder la phrase'}).click();
  await page.getByRole('button',{name:'Continuer ma journée',exact:true}).click();
  await expect(page.getByRole('button',{name:'Rejoindre Ruby'})).toBeVisible();
  await page.getByRole('button',{name:'Rejoindre Ruby'}).click();
  await expect(page.getByText('Morning! What can I get you?',{exact:true})).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'Écrire',exact:true}).click();
  await page.locator('#practice-text').fill('Can I have a tea, please?');
  await page.getByRole('button',{name:'Comparer avec un exemple'}).click();
  await expect(page.getByText('One way to say it')).toBeVisible();
  await page.getByRole('button',{name:'Vérifier avec le défi guidé'}).click();
  await page.locator('[data-action="answer"][data-correct="true"]').click();
  await page.getByRole('button',{name:'Continuer ma journée',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Rejoindre Sam'})).toBeVisible();
  await page.getByRole('button',{name:'Rejoindre Sam'}).click();
  await expect(page.getByText('Hello! Do you live around here?',{exact:true})).toBeVisible({timeout:30000});
  await page.locator('[data-action="answer"][data-correct="true"]').click();
  await page.getByRole('button',{name:'Continuer ma journée',exact:true}).click();
  await expect(page.getByText('Look how far')).toBeVisible();
  await page.locator('#reflection').fill('I learned how to introduce myself.');
  await page.getByRole('button',{name:'Passer au jour 2'}).click();
  await expect(page.getByRole('heading',{name:'A little routine.'})).toBeVisible();
  await page.getByRole('button',{name:'Mon carnet',exact:true}).click();
  await expect(page.getByText('I learned how to introduce myself.')).toBeVisible();
  await expect(page.locator('.saved-phrase')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('mobile: touch interface, 3D, conversation and complete journey fit the viewport', async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto('/');
  await page.getByRole('button',{name:'Entrer dans Harbour'}).click();
  await expect(page.locator('#joystick')).toBeVisible();
  expect(await page.locator('#world').evaluate(c=>!!c.getContext('webgl2'))).toBe(true);
  await page.screenshot({path:'/tmp/hello-harbour-mobile.png'});
  await page.getByRole('button',{name:'Rejoindre Jamie'}).click();
  await expect(page.locator('.answer-option')).toHaveCount(3);
  await page.screenshot({path:'/tmp/hello-harbour-mobile-chat.png'});
  const rect=await page.locator('#modal').boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(390);
  await page.getByRole('button',{name:'Fermer',exact:true}).click();
  await page.getByRole('button',{name:'Préparer son petit-déjeuner',exact:true}).click();
  await page.getByRole('button',{name:'B Porridge with berries',exact:false}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hello-harbour-v1')).activities)).toContain('1:home');
  await page.getByRole('button',{name:'30 jours',exact:true}).click();
  await expect(page.locator('.journey-day')).toHaveCount(30);
  await expect(page.locator('.journey-day:disabled')).toHaveCount(29);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test('day 30 can be completed and saved; reset only erases this game', async ({page}) => {
  await page.addInitScript(({days})=>{
    localStorage.setItem('unrelated-app','keep-me');
    localStorage.setItem('hello-harbour-v1',JSON.stringify({version:1,day:30,scene:2,started:true,completed:days.flatMap(d=>d.scenes).filter(s=>s.id!=='30-2').map(s=>s.id),firstTry:[],saved:[],notes:[],attempts:{},name:'Charlie',sound:false}));
  },{days:DAYS});
  await page.goto('/');
  await page.getByRole('button',{name:'Rejoindre Jamie'}).click();
  await page.locator('[data-action="answer"][data-correct="true"]').click();
  await page.getByRole('button',{name:'Continuer ma journée',exact:true}).click();
  await expect(page.getByText('Vous avez vécu les 90 situations de Harbour.',{exact:false})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hello-harbour-v1')).completed.length)).toBe(90);
  await page.getByRole('button',{name:'Fermer',exact:true}).click();
  await page.getByRole('button',{name:'Réglages',exact:true}).click();
  await page.getByRole('button',{name:'Effacer ma progression',exact:true}).click();
  await page.getByRole('button',{name:'Oui, effacer et recommencer'}).click();
  await expect(page.getByRole('button',{name:'Entrer dans Harbour'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('unrelated-app'))).toBe('keep-me');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hello-harbour-v1')).completed.length)).toBe(0);
});

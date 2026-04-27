export type TourStop = {
  id: string;
  title: string;
  text: string;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
  durationMs: number;
  orbit?: TourOrbit;
};
type TourOrbit = {
  enabled: boolean;
  yawAmplitude: number; // насколько широко качаемся в стороны
  yawSpeed: number;     // скорость
  verticalBob?: number; // лёгкое движение вверх-вниз
};

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'overview',
    title: '1. Общий вид чёрной дыры',
    text: 'Перед нами не просто тёмный шар в космосе. Сама чёрная дыра не светится и не отражает свет, поэтому напрямую увидеть её нельзя. Мы замечаем её по тому, как она действует на окружающее вещество и на свет. Горячий газ и пыль вокруг неё образуют аккреционный диск — раскалённую структуру, которая может излучать в разных диапазонах, вплоть до рентгеновского. Ещё один важный момент: чёрная дыра — не “космический пылесос”, который всасывает всё подряд. Если находиться достаточно далеко, её гравитация действует так же, как гравитация любого другого объекта той же массы.',
    cameraPosition: { x: 0, y: 18, z: 34 },
    target: { x: 0, y: 0, z: 0 },
    durationMs: 50000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }

  },
  {
    id: 'overview',
    title: '2. Горизонт событий',
    text: 'Самая важная граница у чёрной дыры — это горизонт событий. Его часто называют точкой невозврата. Если объект пересекает эту границу, выбраться обратно уже не сможет даже свет. Но на визуализациях мы обычно видим не сам горизонт событий, а тёмную область и яркое кольцо вокруг неё. Это связано с тем, что горячий газ светится, а сильная гравитация искривляет траектории света. Поэтому наблюдатель видит характерную “тень” чёрной дыры на фоне светящегося вещества. Именно такой принцип лежит в основе известных изображений, полученных телескопом Event Horizon Telescope.',
    cameraPosition: { x: -14, y: 12, z: 26 },
    target: { x: 0, y: 0, z: 0 },
    durationMs: 50000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }

  },
  {
    id: 'overview',
    title: '3. Аккреционный диск',
    text: 'Сейчас хорошо видно, что самый зрелищный элемент здесь — это не сама чёрная дыра, а аккреционный диск. Он состоит из газа и пыли, которые закручиваются вокруг чёрной дыры и постепенно падают внутрь. По мере движения вещество нагревается из-за трения и огромных скоростей, поэтому диск начинает ярко светиться. NASA отдельно подчёркивает, что такие диски могут излучать во многих диапазонах, включая рентгеновский. Иногда часть вещества не падает сразу, а перенаправляется в виде струй — джетов, которые вырываются от чёрной дыры с очень высокой скоростью. По этим эффектам астрономы и находят многие чёрные дыры.',
    cameraPosition: { x: 20, y: 10, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    durationMs: 50000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }

  },
  {
    id: 'overview',
    title: '4. Искривление света и “кольца”',
    text: 'Здесь особенно важно смотреть не только на диск, но и на то, как ведёт себя свет рядом с чёрной дырой. Сильная гравитация искривляет пространство-время, а вместе с ним и траектории лучей. Поэтому свет может огибать чёрную дыру, и наблюдатель видит искажения, дублирующиеся участки диска и яркие кольцевые структуры. В материалах NASA про визуализацию чёрной дыры прямо говорится о photon rings — светящихся кольцах, возникающих из-за света, который обошёл чёрную дыру один или несколько раз. Из-за этого изображение рядом с чёрной дырой выглядит не интуитивно и кажется почти “ломающим” обычную перспективу.',
    cameraPosition: { x: 0, y: 28, z: 42 },
    target: { x: 0, y: 0, z: 0 },
    durationMs: 50000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }

  },
  {
    id: 'overview',
    title: '5. Что будет с человеком рядом с чёрной дырой',
    text: 'Если представить путешествие к чёрной дыре, начинается самое странное. Во-первых, рядом с ней время идёт иначе: чем ближе к сильному источнику гравитации, тем медленнее течёт время по сравнению с удалённым наблюдателем. NASA приводит пример, что объект, приближающийся к горизонту событий, со стороны будет казаться всё более медленным, почти “застывшим”. Во-вторых, возникает так называемая спагеттификация: разница в гравитационном притяжении между ближней и дальней частью тела начинает растягивать объект. При этом NASA отдельно отмечает, что для сверхмассивной чёрной дыры пересечение горизонта может быть мягче, чем для чёрной дыры звёздной массы, потому что приливные силы у горизонта там слабее.',
    cameraPosition: { x: 16, y: 6, z: 30},
    target: { x: 0, y: 0, z: 0 },
    durationMs: 50000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }
  },

  {
    id: 'overview',
    title: '6. Реальные чёрные дыры: Sgr A* и M87*',
    text: 'И всё это не только теория. В центре нашей галактики находится Sagittarius A*, или Sgr A* — сверхмассивная чёрная дыра примерно в 27 тысячах световых лет от Земли, с массой около четырёх миллионов Солнц. В 2022 году Event Horizon Telescope получил её первое изображение. До этого в 2019 году был показан первый в истории снимок чёрной дыры M87* в галактике Messier 87. Она гораздо дальше — примерно в 55 миллионах световых лет от нас — и намного массивнее: около 6.5 миллиарда солнечных масс. Интересно, что рядом с горизонтом обе чёрные дыры выглядят удивительно похоже, хотя по масштабу сильно различаются.',
    cameraPosition: { x: -10, y: 20, z: 38},
    target: { x: 0, y: 0, z: 0 },
    durationMs: 60000,
    orbit: {
    enabled: true,
    yawAmplitude: 0.18,
    yawSpeed: 0.02,
    verticalBob: 0.4
  }
  },
];

type TourScreenCallbacks = {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onBack: () => void;
};

type TourScreenParams = {
  stop: TourStop;
  index: number;
  total: number;
  callbacks: TourScreenCallbacks;
};

export class TourScreen {
  constructor(private params: TourScreenParams) {}

  render(): HTMLElement {
    const root = document.createElement('div');
    root.style.position = 'absolute';
    root.style.inset = '0';
    root.style.pointerEvents = 'none';
    //
    root.style.opacity = '0';
    root.style.transition = 'opacity 700ms ease';

    const topBar = document.createElement('div');
    topBar.style.position = 'absolute';
    topBar.style.top = '24px';
    topBar.style.left = '24px';
    topBar.style.right = '24px';
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.pointerEvents = 'none';
    //
    topBar.style.opacity = '0';
    topBar.style.transition = 'opacity 700ms ease, transform 320ms ease';

    

    const counter = document.createElement('div');
    counter.textContent = `${this.params.index + 1} / ${this.params.total}`;
    counter.style.color = 'white';
    counter.style.fontFamily = '"Cormorant", serif';
    counter.style.fontSize = '20px';
    counter.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.85)';
    counter.style.pointerEvents = 'none';

    topBar.appendChild(counter);

    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.left = '32px';
    panel.style.bottom = '32px';
    panel.style.width = 'min(520px, calc(100vw - 64px))';
    panel.style.pointerEvents = 'auto';
    //
    panel.style.opacity = '0';
    panel.style.transition = 'opacity 700ms ease, transform 320ms ease';

    const title = document.createElement('h2');
    title.textContent = this.params.stop.title;
    title.style.margin = '0 0 14px 0';
    title.style.color = 'white';
    title.style.fontFamily = '"Cormorant", serif';
    title.style.fontSize = '42px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.1';
    title.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.85)';

    const text = document.createElement('p');
    text.textContent = this.params.stop.text;
    text.style.margin = '0 0 20px 0';
    text.style.color = 'white';
    text.style.fontFamily = '"Cormorant", serif';
    text.style.fontSize = '28px';
    text.style.lineHeight = '1.3';
    text.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.85)';

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '18px';
    controls.style.flexWrap = 'wrap';

    const prevButton = this.createTextButton(
  '← Назад',
  () => animateOutAndRun(this.params.callbacks.onPrev)
);

const nextButton =
  this.params.index < this.params.total - 1
    ? this.createTextButton(
        'Далее →',
        () => animateOutAndRun(this.params.callbacks.onNext)
      )
    : null;

const skipButton = this.createTextButton(
  'Закончить',
  () => animateOutAndRun(this.params.callbacks.onSkip)
);
    if (this.params.index === 0) {
      prevButton.style.opacity = '0.45';
      prevButton.disabled = true;
      prevButton.style.cursor = 'default';
    }

    controls.appendChild(prevButton);
if (nextButton) {
  controls.appendChild(nextButton);
}    controls.appendChild(skipButton);

    panel.appendChild(title);
    panel.appendChild(text);
    panel.appendChild(controls);

    root.appendChild(topBar);
    root.appendChild(panel);

    //
    const animateOutAndRun = (callback: () => void): void => {
  root.style.pointerEvents = 'none';
  root.style.opacity = '0';

  topBar.style.opacity = '0';

  panel.style.opacity = '0';

  window.setTimeout(() => {
    callback();
  }, 650);
};

    requestAnimationFrame(() => {
  root.style.opacity = '1';

  topBar.style.opacity = '1';

  panel.style.opacity = '1';
});

    return root;
  }

  private createTextButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;

    button.style.background = 'transparent';
    button.style.border = 'none';
    button.style.outline = 'none';
    button.style.padding = '0';
    button.style.color = 'white';
    button.style.fontFamily = '"Cormorant", serif';
    button.style.fontSize = '20px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.85)';
    button.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    button.style.opacity = '0.9';

    button.addEventListener('mouseenter', () => {
      if (button.disabled) return;
      button.style.transform = 'scale(1.03)';
      button.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      if (button.disabled) return;
      button.style.transform = 'scale(1)';
      button.style.opacity = '0.9';
    });

    button.addEventListener('click', onClick);

    return button;
  }
}
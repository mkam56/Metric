# Проект

Проект сейчас в стадии **базы + Black Hole**. Главная цель — аккуратная архитектура сцен/рендера, чтобы мы могли постепенно добавлять новые объекты и эффекты без переписывания всего движка.

## Build

```bash
# 1) установить зависимости
npm install

# 2) запустить dev
npm run dev
```

## Архитектура

main.ts → Engine → SceneManager → Scene.update() → Renderer.render()

Engine: главный цикл, время, debug overlay, ввод (Space/N/P)

CameraController: THREE.PerspectiveCamera + OrbitControls

SceneManager: хранит текущую сцену, вызывает init/update/dispose

Renderer: Three.js renderer + postprocessing composer

Scene: создаёт объекты сцены и обновляет uniforms каждый кадр

## Как работает рендер

1) Для каждого пикселя строим луч из камеры (inverse proj/view)
2) Маршируем по лучу (STEPS)
3) На каждом сегменте проверяем пересечение с “толщиной” диска
4) Если внутри диска — интегрируем объём (segSteps/volSteps)
5) Считаем эмиссию/поглощение + доплер/гравитационный фактор
6) Добавляем фон (звёзды) + dither, отдаём HDR цвет

## Как добавлять новые экспонаты

Мини-шаблон: новый объект

Модель (параметры/формулы):
```
physics/pulsar/PulsarModel.ts
```
Материал + шейдер:
```
rendering/pulsar/PulsarMaterial.ts
rendering/pulsar/shaders/pulsar.ts
```
Сцена:
```
scenes/PulsarScene.ts
```
Подключение:
Пока в ```Engine``` создаётся ```new BlackHoleScene()```. Позже добавим “музейный переключатель сцен”.

## Git workflow

main всегда в рабочем состоянии

каждый делает фичу в своей ветке

merge только через PR с ревью

```bash
git checkout main
git pull

git checkout -b yourname/feature-name

# чет пишем...
git add -A
git commit -m "feat(pulsar): add base model and shader"
git push -u origin yourname/feature-name
```

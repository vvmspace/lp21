const rituals = [
  {
    title: 'Дыхание 4-4',
    detail: 'Сделай четыре мягких вдоха и выдоха. Мы не спешим.',
  },
  {
    title: 'Вода + тепло',
    detail: 'Один стакан воды и тёплая пауза в теле.',
  },
  {
    title: 'Мини-шаг',
    detail: 'Один микрошаг, который делает день устойчивее.',
  },
];

const metrics = [
  { label: 'Сон', value: 'Стабильный' },
  { label: 'Внутренний шум', value: 'Снижается' },
  { label: 'Режим', value: 'Формируется' },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero__content">
          <p className="badge">Life Protocol · v2.1</p>
          <h1>Система, которая держит тебя, когда всё шумит.</h1>
          <p className="subtitle">
            Мы не требуем. Мы бережно создаём рамки, в которых воля
            возвращается сама.
          </p>
          <div className="hero__actions">
            <button className="primary">Начать ритуал</button>
            <button className="ghost">Показать мой режим</button>
          </div>
        </div>
        <div className="hero__card">
          <h2>Состояние сейчас</h2>
          <p className="muted">Нейтральная фиксация вместо оценки.</p>
          <div className="metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="pulse">
            <div className="pulse__dot" />
            <p>AI рядом. Он удерживает ритм.</p>
          </div>
        </div>
      </section>

      <section className="rituals">
        <h2>Сегодняшние мягкие рамки</h2>
        <div className="rituals__grid">
          {rituals.map((ritual) => (
            <article key={ritual.title} className="ritual">
              <h3>{ritual.title}</h3>
              <p>{ritual.detail}</p>
              <button className="ghost">Я сделаю это</button>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Ты не обязан справляться в одиночку.</h2>
          <p>
            Life Protocol удерживает пространство, пока ты возвращаешь
            устойчивость. Без давления и сравнения.
          </p>
        </div>
        <button className="primary">Войти или создать профиль</button>
      </section>
    </main>
  );
}

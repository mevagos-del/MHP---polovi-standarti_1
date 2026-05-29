function Header() {
  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        <div className="brand">
          <div className="brand__mark">MHP</div>
          <div>
            <p className="brand__suite">MHP Business Tools</p>
            <h1>Польові стандарти</h1>
            <p className="brand__subtitle">Планування активностей торгової команди</p>
          </div>
        </div>
        <div className="portal-header__status">PWA MVP</div>
      </div>
    </header>
  );
}

export default Header;

const fs = require('fs');
const path = require('path');

const cssToAdd = `
/* ==========================================
   FOOTER COMPONENT
   ========================================== */
.skmd-footer {
  background-color: var(--color-bg-offset);
  border-top: 1px solid var(--color-border);
  margin-top: 80px;
  color: var(--color-text-main);
}
.skmd-footer__main {
  padding: 60px 20px;
}
.skmd-footer__col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.skmd-logo--footer .skmd-logo__text {
  font-size: 1.25rem;
}
.skmd-footer__desc {
  color: var(--color-text-light);
  font-size: 0.95rem;
  line-height: 1.6;
}
.skmd-footer__title {
  font-size: 1.125rem;
  color: var(--color-primary-dark);
  margin-bottom: 4px;
}
.skmd-footer__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skmd-footer__list a {
  color: var(--color-text-light);
  text-decoration: none;
  transition: color var(--transition-fast);
}
.skmd-footer__list a:hover {
  color: var(--color-primary);
}
.skmd-footer__contact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skmd-footer__contact li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: var(--color-text-light);
  line-height: 1.5;
}
.skmd-footer__contact i {
  color: var(--color-primary);
  margin-top: 4px;
}
.skmd-social {
  display: flex;
  gap: 12px;
}
.skmd-social__link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-white);
  color: var(--color-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}
.skmd-social__link:hover {
  background-color: var(--color-primary);
  color: var(--color-white);
  transform: translateY(-2px);
}
.skmd-footer__bottom {
  border-top: 1px solid var(--color-border);
  padding: 24px 0;
  background-color: var(--color-white);
}
.skmd-footer__bottom-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
@media (min-width: 768px) {
  .skmd-footer__bottom-inner {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}
.skmd-footer__copyright {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}
.skmd-footer__legal {
  display: flex;
  gap: 24px;
}
.skmd-footer__legal a {
  color: var(--color-text-light);
  font-size: 0.875rem;
}
.skmd-footer__legal a:hover {
  color: var(--color-primary);
}
`;

fs.appendFileSync('c:/xampp/htdocs/cattricantho/assets/css/components.css', cssToAdd);

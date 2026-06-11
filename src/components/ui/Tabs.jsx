import { createContext, useContext, useId, useCallback, useRef } from 'react';

const TabsContext = createContext(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

export function Tabs({
  value,
  onChange,
  className = '',
  listClassName = '',
  children,
  'aria-label': ariaLabel,
}) {
  const baseId = useId();
  const tabValuesRef = useRef([]);

  const registerTab = useCallback((tabValue) => {
    if (!tabValuesRef.current.includes(tabValue)) {
      tabValuesRef.current = [...tabValuesRef.current, tabValue];
    }
  }, []);

  const handleArrowKey = useCallback(
    (currentValue, direction) => {
      const tabs = tabValuesRef.current;
      const idx = tabs.indexOf(currentValue);
      if (idx === -1) return;
      const next =
        direction === 'next' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      onChange(tabs[next]);
      const nextId = `${baseId}-tab-${tabs[next]}`;
      document.getElementById(nextId)?.focus();
    },
    [baseId, onChange]
  );

  return (
    <TabsContext.Provider
      value={{ value, onChange, listClassName, baseId, registerTab, handleArrowKey, ariaLabel }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function List({ children, className = '' }) {
  const { listClassName, ariaLabel } = useTabsContext();
  return (
    <div role="tablist" aria-label={ariaLabel} className={`${listClassName} ${className}`.trim()}>
      {children}
    </div>
  );
}

function Trigger({ value, children, className = '', activeClassName = 'active' }) {
  const { value: activeValue, onChange, baseId, registerTab, handleArrowKey } = useTabsContext();
  registerTab(value);
  const isActive = activeValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={`${className}${isActive ? ` ${activeClassName}` : ''}`}
      onClick={() => onChange(value)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleArrowKey(value, 'next');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleArrowKey(value, 'prev');
        }
      }}
    >
      {children}
    </button>
  );
}

function Panel({ value, children, className = '' }) {
  const { value: activeValue, baseId } = useTabsContext();
  if (activeValue !== value) return null;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={0} className={className}>
      {children}
    </div>
  );
}

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Panel = Panel;

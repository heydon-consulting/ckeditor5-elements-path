/**
 * @file
 * A bar under the editing area listing the elements around the cursor.
 *
 * Like CKEditor 4's Elements Path: the outermost element comes first, and
 * clicking one selects it. The bar is always shown, except while editing the
 * source.
 */

import { Plugin } from 'ckeditor5/src/core';

/**
 * Whether a view element is editing-only markup, not part of the content.
 *
 * Lists and tables wrap a single paragraph in a "bogus" span while editing,
 * which isn't in the saved HTML.
 */
function isEditingOnly(element) {
  return element.name === 'span'
    && [...element.getClassNames()].some((name) => name.endsWith('-bogus-paragraph'));
}

/**
 * Returns an element's classes, without CKEditor's editing classes.
 */
function contentClasses(element) {
  return [...element.getClassNames()].filter((name) => !name.startsWith('ck-') && !name.startsWith('ck_'));
}

export default class ElementsPath extends Plugin {
  static get pluginName() {
    return 'ElementsPath';
  }

  init() {
    const { editor } = this;
    // CKEditor's own translations (CKEDITOR_TRANSLATIONS), English without.
    const { t } = editor;

    this.bar = document.createElement('div');
    this.bar.className = 'ck ck-elements-path';
    this.bar.setAttribute('role', 'group');
    this.bar.setAttribute('aria-label', t('Elements path'));

    // The elements the bar's buttons stand for, by index.
    this.elements = [];
    // Keep the editor's selection and focus when a button is pressed.
    this.bar.addEventListener('mousedown', (event) => event.preventDefault());
    this.bar.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-index]');
      if (button) {
        this.select(this.elements[Number(button.dataset.index)]);
      }
    });

    editor.ui.on('ready', () => {
      editor.ui.view.element.appendChild(this.bar);
      this.update();
    });

    // After every render of the editing view, so after each selection or
    // content change.
    this.listenTo(editor.editing.view, 'render', () => this.update());
  }

  afterInit() {
    // The bar has nothing to show while editing the source.
    if (this.editor.plugins.has('SourceEditing')) {
      this.listenTo(this.editor.plugins.get('SourceEditing'), 'change:isSourceEditingMode', () => this.update());
    }
  }

  destroy() {
    this.bar.remove();
    super.destroy();
  }

  /**
   * Returns the view elements around the selection, outermost first.
   */
  path() {
    const { selection } = this.editor.editing.view.document;
    let node = selection.getSelectedElement() ?? selection.getFirstPosition()?.parent;
    const elements = [];
    for (; node && !node.is('rootElement'); node = node.parent) {
      if (node.is('element') && !node.is('uiElement') && !node.is('rawElement') && !isEditingOnly(node)) {
        elements.unshift(node);
      }
    }
    return elements;
  }

  /**
   * Redraws the bar for the current selection.
   */
  update() {
    const sourceEditing = this.editor.plugins.has('SourceEditing') && this.editor.plugins.get('SourceEditing');
    const hidden = Boolean(sourceEditing && sourceEditing.isSourceEditingMode);
    this.bar.hidden = hidden;
    this.elements = hidden ? [] : this.path();

    this.bar.replaceChildren(...this.elements.flatMap((element, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ck-elements-path__item';
      button.dataset.index = String(index);
      button.textContent = element.name;
      // Like a CSS selector, e.g. "mark.demo-marker".
      const selector = [element.name, ...contentClasses(element)].join('.');
      button.title = this.editor.t('Select %0', [selector]);
      if (index === this.elements.length - 1) {
        button.setAttribute('aria-current', 'true');
      }
      if (index === 0) {
        return [button];
      }
      const separator = document.createElement('span');
      separator.className = 'ck-elements-path__separator';
      separator.setAttribute('aria-hidden', 'true');
      separator.textContent = '›';
      return [separator, button];
    }));
    // Keeps its height when empty, so the editor doesn't jump.
    if (!hidden && !this.elements.length) {
      this.bar.textContent = ' ';
    }
  }

  /**
   * Selects a view element in the editor, as CKEditor 4 did on a click.
   */
  select(viewElement) {
    if (!viewElement) {
      return;
    }
    const { model, editing } = this.editor;
    const { mapper } = editing;
    model.change((writer) => {
      // Inline elements (<strong>, <a>) are attributes on the model's text:
      // select their text.
      if (viewElement.is('attributeElement')) {
        writer.setSelection(mapper.toModelRange(editing.view.createRangeIn(viewElement)));
        return;
      }
      // Otherwise the model element, or the closest one an element is part
      // of (e.g. a <tr> is part of a table).
      let modelElement = null;
      for (let node = viewElement; node && !modelElement; node = node.parent) {
        modelElement = mapper.toModelElement(node);
      }
      if (!modelElement) {
        return;
      }
      if (model.schema.isObject(modelElement)) {
        writer.setSelection(modelElement, 'on');
      }
      else {
        writer.setSelection(writer.createRangeIn(modelElement));
      }
    });
    editing.view.focus();
  }
}

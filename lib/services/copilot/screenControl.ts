/**
 * Screen Control Service
 * Enables Hazalyze Copilot to analyze and control the screen
 *
 * Capabilities:
 * - Analyze current page structure
 * - Find and interact with elements
 * - Navigate between pages
 * - Extract data from the page
 * - Execute automated workflows
 */

export interface ScreenElement {
  id?: string;
  type:
    | "button"
    | "input"
    | "select"
    | "link"
    | "table"
    | "text"
    | "container"
    | "other";
  text?: string;
  value?: string;
  placeholder?: string;
  visible: boolean;
  clickable: boolean;
  selectable: boolean;
  editable: boolean;
  attributes: Record<string, string>;
  position?: { x: number; y: number; width: number; height: number };
  selector?: string;
  xpath?: string;
}

export interface ScreenAnalysis {
  url: string;
  title: string;
  elements: ScreenElement[];
  forms: FormInfo[];
  tables: TableInfo[];
  buttons: ScreenElement[];
  inputs: ScreenElement[];
  links: ScreenElement[];
  text: string;
  structure: PageStructure;
}

export interface FormInfo {
  id?: string;
  name?: string;
  action?: string;
  method?: string;
  fields: FormField[];
  submitButton?: ScreenElement;
}

export interface FormField {
  name: string;
  type: string;
  label?: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  element: ScreenElement;
}

export interface TableInfo {
  id?: string;
  headers: string[];
  rows: string[][];
  element: ScreenElement;
}

export interface PageStructure {
  mainContent?: string;
  navigation?: ScreenElement[];
  sidebar?: ScreenElement[];
  footer?: ScreenElement[];
  modals?: ScreenElement[];
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  screenshot?: string;
}

export interface ActionRequest {
  type:
    | "click"
    | "type"
    | "select"
    | "navigate"
    | "extract"
    | "screenshot"
    | "wait"
    | "scroll";
  target?: string; // Selector, text, or description
  value?: string; // For type/select actions
  options?: Record<string, any>;
}

/**
 * Screen Control Service
 */
export class ScreenControlService {
  /**
   * Analyze current page
   */
  analyzePage(): ScreenAnalysis {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("Screen analysis only works in browser environment");
    }

    const elements = this.extractElements();
    const forms = this.extractForms();
    const tables = this.extractTables();

    return {
      url: window.location.href,
      title: document.title,
      elements,
      forms,
      tables,
      buttons: elements.filter((e) => e.type === "button"),
      inputs: elements.filter((e) => e.type === "input"),
      links: elements.filter((e) => e.type === "link"),
      text: document.body.innerText || "",
      structure: this.analyzeStructure(),
    };
  }

  /**
   * Extract all interactive elements from page
   */
  private extractElements(): ScreenElement[] {
    const elements: ScreenElement[] = [];
    const selectors = [
      "button",
      "input",
      "select",
      "textarea",
      "a[href]",
      '[role="button"]',
      "[onclick]",
      "[data-testid]",
      "[aria-label]",
    ];

    selectors.forEach((selector) => {
      try {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node, index) => {
          if (node instanceof HTMLElement) {
            const element = this.elementToScreenElement(node, selector, index);
            if (element) {
              elements.push(element);
            }
          }
        });
      } catch (e) {
        console.warn(`Error extracting ${selector}:`, e);
      }
    });

    return elements;
  }

  /**
   * Convert DOM element to ScreenElement
   */
  private elementToScreenElement(
    element: HTMLElement,
    selector: string,
    index: number,
  ): ScreenElement | null {
    const rect = element.getBoundingClientRect();
    const isVisible =
      rect.width > 0 &&
      rect.height > 0 &&
      window.getComputedStyle(element).visibility !== "hidden";

    if (!isVisible) return null;

    const text = this.getElementText(element);
    const type = this.getElementType(element);

    return {
      id: element.id || undefined,
      type,
      text: text || undefined,
      value: this.getElementValue(element),
      placeholder: (element as HTMLInputElement).placeholder || undefined,
      visible: isVisible,
      clickable: this.isClickable(element),
      selectable: type === "select" || type === "input",
      editable: type === "input" || type === "select",
      attributes: this.getAttributes(element),
      position: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      selector: this.generateSelector(element),
      xpath: this.generateXPath(element),
    };
  }

  /**
   * Get element type
   */
  private getElementType(element: HTMLElement): ScreenElement["type"] {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute("role");

    if (tagName === "button" || role === "button") return "button";
    if (tagName === "input" || tagName === "textarea") return "input";
    if (tagName === "select") return "select";
    if (tagName === "a") return "link";
    if (tagName === "table") return "table";
    if (
      element.textContent &&
      !element.querySelector("button, input, select, a")
    )
      return "text";
    if (
      element.classList.contains("container") ||
      element.id?.includes("container")
    )
      return "container";

    return "other";
  }

  /**
   * Get element text
   */
  private getElementText(element: HTMLElement): string {
    // Try aria-label first
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();

    // Try title
    const title = element.getAttribute("title");
    if (title) return title.trim();

    // Try text content (but exclude nested interactive elements)
    const text = element.textContent?.trim();
    if (text && text.length < 200) return text;

    // Try placeholder for inputs
    if (element instanceof HTMLInputElement && element.placeholder) {
      return element.placeholder;
    }

    return "";
  }

  /**
   * Get element value
   */
  private getElementValue(element: HTMLElement): string | undefined {
    if (element instanceof HTMLInputElement) {
      return element.value || undefined;
    }
    if (element instanceof HTMLSelectElement) {
      return element.value || undefined;
    }
    if (element instanceof HTMLTextAreaElement) {
      return element.value || undefined;
    }
    return undefined;
  }

  /**
   * Check if element is clickable
   */
  private isClickable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute("role");
    const hasOnClick =
      element.hasAttribute("onclick") ||
      element.onclick !== null ||
      window.getComputedStyle(element).cursor === "pointer";

    return (
      tagName === "button" ||
      tagName === "a" ||
      role === "button" ||
      hasOnClick ||
      element.classList.contains("btn") ||
      element.classList.contains("button")
    );
  }

  /**
   * Get element attributes
   */
  private getAttributes(element: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr) => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: HTMLElement): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }

    // Try data-testid
    const testId = element.getAttribute("data-testid");
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Try class names
    if (element.className) {
      const classes = element.className
        .split(" ")
        .filter((c) => c)
        .join(".");
      if (classes) {
        const tag = element.tagName.toLowerCase();
        return `${tag}.${classes}`;
      }
    }

    // Fallback to tag name with index
    const tag = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === element.tagName,
      );
      const index = siblings.indexOf(element);
      return `${tag}:nth-of-type(${index + 1})`;
    }

    return tag;
  }

  /**
   * Generate XPath for element
   */
  private generateXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      const siblings = current.parentElement?.children || [];

      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] === current) {
          index = i + 1;
          break;
        }
      }

      const tag = current.tagName.toLowerCase();
      parts.unshift(`${tag}[${index}]`);
      current = current.parentElement;
    }

    return "/" + parts.join("/");
  }

  /**
   * Extract forms from page
   */
  private extractForms(): FormInfo[] {
    const forms: FormInfo[] = [];
    const formElements = document.querySelectorAll("form");

    formElements.forEach((form) => {
      if (form instanceof HTMLFormElement) {
        const fields: FormField[] = [];
        const inputs = form.querySelectorAll("input, select, textarea");

        inputs.forEach((input) => {
          if (input instanceof HTMLElement) {
            const element = this.elementToScreenElement(input, "input", 0);
            if (element) {
              fields.push({
                name: (input as HTMLInputElement).name || "",
                type: (input as HTMLInputElement).type || "text",
                label: this.findLabelFor(input),
                value: (input as HTMLInputElement).value,
                required: (input as HTMLInputElement).required,
                placeholder: (input as HTMLInputElement).placeholder,
                options:
                  input instanceof HTMLSelectElement
                    ? Array.from(input.options).map((opt) => opt.value)
                    : undefined,
                element,
              });
            }
          }
        });

        const submitButton = form.querySelector(
          'button[type="submit"], input[type="submit"]',
        );
        const submitElement =
          submitButton instanceof HTMLElement
            ? this.elementToScreenElement(submitButton, "button", 0)
            : undefined;

        forms.push({
          id: form.id || undefined,
          name: form.name || undefined,
          action: form.action || undefined,
          method: form.method || undefined,
          fields,
          submitButton: submitElement,
        });
      }
    });

    return forms;
  }

  /**
   * Find label for input element
   */
  private findLabelFor(element: HTMLElement): string | undefined {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || undefined;
    }

    // Check if element is inside a label
    const parentLabel = element.closest("label");
    if (parentLabel) {
      return parentLabel.textContent?.trim() || undefined;
    }

    // Check for aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();

    return undefined;
  }

  /**
   * Extract tables from page
   */
  private extractTables(): TableInfo[] {
    const tables: TableInfo[] = [];
    const tableElements = document.querySelectorAll("table");

    tableElements.forEach((table) => {
      if (table instanceof HTMLTableElement) {
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers
        const headerRow = table.querySelector("thead tr, tr:first-child");
        if (headerRow) {
          headerRow.querySelectorAll("th, td").forEach((cell) => {
            headers.push(cell.textContent?.trim() || "");
          });
        }

        // Extract rows
        const dataRows = table.querySelectorAll(
          "tbody tr, tr:not(:first-child)",
        );
        dataRows.forEach((row) => {
          const rowData: string[] = [];
          row.querySelectorAll("td, th").forEach((cell) => {
            rowData.push(cell.textContent?.trim() || "");
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });

        const element = this.elementToScreenElement(table, "table", 0);
        if (element) {
          tables.push({
            id: table.id || undefined,
            headers,
            rows,
            element,
          });
        }
      }
    });

    return tables;
  }

  /**
   * Analyze page structure
   */
  private analyzeStructure(): PageStructure {
    return {
      mainContent: document
        .querySelector('main, [role="main"], .main-content')
        ?.textContent?.substring(0, 500),
      navigation: this.extractNavigation(),
      sidebar: this.extractSidebar(),
      footer: document.querySelector("footer")?.textContent?.substring(0, 200),
      modals: this.extractModals(),
    };
  }

  /**
   * Extract navigation elements
   */
  private extractNavigation(): ScreenElement[] {
    const nav = document.querySelector(
      'nav, [role="navigation"], .navbar, .navigation',
    );
    if (!nav) return [];

    const links = nav.querySelectorAll('a, button, [role="link"]');
    const elements: ScreenElement[] = [];

    links.forEach((link, index) => {
      if (link instanceof HTMLElement) {
        const element = this.elementToScreenElement(link, "nav-link", index);
        if (element) elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Extract sidebar elements
   */
  private extractSidebar(): ScreenElement[] {
    const sidebar = document.querySelector(
      'aside, [role="complementary"], .sidebar',
    );
    if (!sidebar) return [];

    const links = sidebar.querySelectorAll("a, button");
    const elements: ScreenElement[] = [];

    links.forEach((link, index) => {
      if (link instanceof HTMLElement) {
        const element = this.elementToScreenElement(
          link,
          "sidebar-link",
          index,
        );
        if (element) elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Extract modal/dialog elements
   */
  private extractModals(): ScreenElement[] {
    const modals = document.querySelectorAll(
      '[role="dialog"], .modal, .dialog',
    );
    const elements: ScreenElement[] = [];

    modals.forEach((modal, index) => {
      if (modal instanceof HTMLElement) {
        const element = this.elementToScreenElement(modal, "modal", index);
        if (element) elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Execute action on screen
   */
  async executeAction(request: ActionRequest): Promise<ActionResult> {
    try {
      switch (request.type) {
        case "click":
          return await this.clickElement(request.target!, request.options);
        case "type":
          return await this.typeIntoElement(
            request.target!,
            request.value || "",
            request.options,
          );
        case "select":
          return await this.selectOption(
            request.target!,
            request.value || "",
            request.options,
          );
        case "navigate":
          return await this.navigateTo(request.target!, request.options);
        case "extract":
          return await this.extractData(request.target!, request.options);
        case "screenshot":
          return await this.takeScreenshot(request.options);
        case "wait":
          return await this.waitFor(request.target!, request.options);
        case "scroll":
          return await this.scrollTo(request.target!, request.options);
        default:
          return {
            success: false,
            message: `Unknown action type: ${request.type}`,
            error: "UNKNOWN_ACTION",
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Click an element
   */
  private async clickElement(
    target: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    const element = await this.findElement(target);
    if (!element) {
      return {
        success: false,
        message: `Element not found: ${target}`,
        error: "ELEMENT_NOT_FOUND",
      };
    }

    try {
      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      await this.delay(100);

      // Click the element
      if (options?.doubleClick) {
        element.dispatchEvent(
          new MouseEvent("dblclick", { bubbles: true, cancelable: true }),
        );
      } else {
        element.click();
      }

      // Wait a bit for any async actions
      await this.delay(options?.waitAfter || 500);

      return {
        success: true,
        message: `Successfully clicked: ${target}`,
        data: { element: this.getElementInfo(element) },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to click: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: "CLICK_FAILED",
      };
    }
  }

  /**
   * Type into an element
   */
  private async typeIntoElement(
    target: string,
    value: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    const element = await this.findElement(target);
    if (
      !element ||
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      return {
        success: false,
        message: `Input element not found: ${target}`,
        error: "ELEMENT_NOT_FOUND",
      };
    }

    try {
      element.focus();
      await this.delay(50);

      // Clear if needed
      if (options?.clear !== false) {
        element.value = "";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // Type character by character if slow mode
      if (options?.slow) {
        for (const char of value) {
          element.value += char;
          element.dispatchEvent(
            new KeyboardEvent("keydown", { key: char, bubbles: true }),
          );
          element.dispatchEvent(
            new KeyboardEvent("keypress", { key: char, bubbles: true }),
          );
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(
            new KeyboardEvent("keyup", { key: char, bubbles: true }),
          );
          await this.delay(50);
        }
      } else {
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }

      await this.delay(100);

      return {
        success: true,
        message: `Successfully typed into: ${target}`,
        data: { value, element: this.getElementInfo(element) },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to type: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: "TYPE_FAILED",
      };
    }
  }

  /**
   * Select an option
   */
  private async selectOption(
    target: string,
    value: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    const element = await this.findElement(target);
    if (!element || !(element instanceof HTMLSelectElement)) {
      return {
        success: false,
        message: `Select element not found: ${target}`,
        error: "ELEMENT_NOT_FOUND",
      };
    }

    try {
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
      await this.delay(100);

      return {
        success: true,
        message: `Successfully selected: ${value}`,
        data: { value, element: this.getElementInfo(element) },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to select: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: "SELECT_FAILED",
      };
    }
  }

  /**
   * Navigate to URL or page
   */
  private async navigateTo(
    target: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    try {
      // Check if it's a relative path or full URL
      if (target.startsWith("http://") || target.startsWith("https://")) {
        window.location.href = target;
      } else {
        // Relative path
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}${target.startsWith("/") ? target : "/" + target}`;
      }

      await this.delay(500);

      return {
        success: true,
        message: `Navigated to: ${target}`,
        data: { url: window.location.href },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to navigate: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: "NAVIGATE_FAILED",
      };
    }
  }

  /**
   * Extract data from page
   */
  private async extractData(
    target: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    const analysis = this.analyzePage();

    // Extract from table
    if (target.includes("table") || options?.type === "table") {
      const table = analysis.tables[0]; // Get first table
      if (table) {
        return {
          success: true,
          message: "Extracted table data",
          data: {
            headers: table.headers,
            rows: table.rows,
            rowCount: table.rows.length,
          },
        };
      }
    }

    // Extract text
    if (target.includes("text") || options?.type === "text") {
      return {
        success: true,
        message: "Extracted page text",
        data: {
          text: analysis.text.substring(0, options?.maxLength || 5000),
        },
      };
    }

    // Extract form data
    if (target.includes("form") || options?.type === "form") {
      const form = analysis.forms[0]; // Get first form
      if (form) {
        return {
          success: true,
          message: "Extracted form data",
          data: {
            fields: form.fields.map((f) => ({
              name: f.name,
              type: f.type,
              label: f.label,
              value: f.value,
            })),
          },
        };
      }
    }

    // Default: return page analysis
    return {
      success: true,
      message: "Extracted page data",
      data: {
        url: analysis.url,
        title: analysis.title,
        elements: analysis.elements.length,
        forms: analysis.forms.length,
        tables: analysis.tables.length,
      },
    };
  }

  /**
   * Take screenshot (limited - can't capture full page in browser)
   */
  private async takeScreenshot(
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    // Note: Full screenshot requires server-side rendering or browser extension
    // This is a placeholder that returns page info
    const analysis = this.analyzePage();

    return {
      success: true,
      message: "Page information captured",
      data: {
        url: analysis.url,
        title: analysis.title,
        elementCount: analysis.elements.length,
        structure: analysis.structure,
      },
    };
  }

  /**
   * Wait for condition
   */
  private async waitFor(
    target: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    const timeout = options?.timeout || 5000;
    const interval = options?.interval || 100;
    const maxAttempts = Math.floor(timeout / interval);

    for (let i = 0; i < maxAttempts; i++) {
      const element = await this.findElement(target, false);
      if (element) {
        return {
          success: true,
          message: `Element appeared: ${target}`,
          data: { waitTime: i * interval },
        };
      }
      await this.delay(interval);
    }

    return {
      success: false,
      message: `Timeout waiting for: ${target}`,
      error: "WAIT_TIMEOUT",
    };
  }

  /**
   * Scroll to element or position
   */
  private async scrollTo(
    target: string,
    options?: Record<string, any>,
  ): Promise<ActionResult> {
    try {
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === "bottom") {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      } else {
        const element = await this.findElement(target);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: options?.block || "center",
          });
        } else {
          return {
            success: false,
            message: `Element not found for scrolling: ${target}`,
            error: "ELEMENT_NOT_FOUND",
          };
        }
      }

      await this.delay(500);

      return {
        success: true,
        message: `Scrolled to: ${target}`,
        data: { scrollY: window.scrollY },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scroll: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: "SCROLL_FAILED",
      };
    }
  }

  /**
   * Find element by various methods
   */
  private async findElement(
    target: string,
    throwIfNotFound = true,
  ): Promise<HTMLElement | null> {
    // Try as selector
    try {
      const bySelector = document.querySelector(target);
      if (bySelector instanceof HTMLElement) {
        return bySelector;
      }
    } catch (e) {
      // Not a valid selector, continue
    }

    // Try by ID
    const byId = document.getElementById(target);
    if (byId) return byId;

    // Try by text content
    const allElements = document.querySelectorAll("*");
    for (const element of allElements) {
      if (element instanceof HTMLElement) {
        const text = this.getElementText(element);
        if (text.toLowerCase().includes(target.toLowerCase())) {
          return element;
        }
      }
    }

    // Try by aria-label
    const byAria = document.querySelector(`[aria-label*="${target}"]`);
    if (byAria instanceof HTMLElement) return byAria;

    // Try by data-testid
    const byTestId = document.querySelector(`[data-testid*="${target}"]`);
    if (byTestId instanceof HTMLElement) return byTestId;

    if (throwIfNotFound) {
      throw new Error(`Element not found: ${target}`);
    }

    return null;
  }

  /**
   * Get element info for response
   */
  private getElementInfo(element: HTMLElement): Record<string, any> {
    return {
      tag: element.tagName,
      id: element.id,
      className: element.className,
      text: this.getElementText(element),
      value: this.getElementValue(element),
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const screenControlService = new ScreenControlService();

export default screenControlService;

import { Extension } from "@tiptap/core";
// import { Node } from "prosemirror-model";
import { TextSelection, AllSelection } from "prosemirror-state";
import { Plugin } from "prosemirror-state";

let isAddKeyTriggered = false;

export function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

export const IndentProps = {
  min: 0,
  max: 210,
  more: 30,
  less: -30,
};

export function isBulletListNode(node) {
  return node.type.name === "bulletList";
}

export function isOrderedListNode(node) {
  return node.type.name === "orderedList";
}

export function isTodoListNode(node) {
  return node.type.name === "listItem";
}

export function isListNode(node) {
  return isBulletListNode(node) || isOrderedListNode(node) || isTodoListNode(node);
}

function setNodeIndentMarkup(tr, pos, delta) {
  if (!tr.doc) return tr;

  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;

  const minIndent = IndentProps.min;
  const maxIndent = IndentProps.max;

  const indent = clamp((node.attrs.indent || 0) + delta, minIndent, maxIndent);

  if (indent === node.attrs.indent) return tr;

  const nodeAttrs = {
    ...node.attrs,
    indent,
  };

  return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
}

function updateIndentLevel(tr, delta) {
  const { doc, selection } = tr;

  if (!doc || !selection) return tr;

  if (!(selection instanceof TextSelection || selection instanceof AllSelection)) {
    return tr;
  }

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;

    if (nodeType.name === "paragraph" || nodeType.name === "heading") {
      tr = setNodeIndentMarkup(tr, pos, delta);
      return false;
    }
    if (isListNode(node)) {
      return false;
    }
    return true;
  });

  return tr;
}

export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      indentLevels: [0, 30, 60, 90, 120, 150, 180, 210],
      defaultIndentLevel: 0,
      onNodeChange: (options) => {
        if (isAddKeyTriggered) {
          const node = options?.nodes[0];
          // node.isAddKeyTriggered = isAddKeyTriggered
          const event = new CustomEvent("nodeChange", { detail: node });
          isAddKeyTriggered = false; // Reset the flag after dispatch
          window.dispatchEvent(event);
        }
      },
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndentLevel,
            renderHTML: (attributes) => {
              return {
                style: `margin-left: ${attributes.indent}px !important`,
              };
            },
            parseHTML: (element) => {
              return parseInt(element.style.marginLeft) || this.options.defaultIndentLevel;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
          ({ tr, state, dispatch }) => {
            const { selection } = state;
            tr = tr.setSelection(selection);
            tr = updateIndentLevel(tr, IndentProps.more);
            console.error("indent 진행")
            if (tr.docChanged) {
              dispatch && dispatch(tr);
              isAddKeyTriggered = true;
              return true;
            }

            return false;
          },
      outdent:
        () =>
          ({ tr, state, dispatch }) => {
            const { selection } = state;
            tr = tr.setSelection(selection);
            tr = updateIndentLevel(tr, IndentProps.less);
            console.error("outdent 진행")
            if (tr.docChanged) {
              dispatch && dispatch(tr);
              isAddKeyTriggered = true;
              return true;
            }

            return false;
          },
    };
  },

  addProseMirrorPlugins() {
    const onNodeChange = this.options.onNodeChange;

    return [
      new Plugin({
        view: () => {
          return {
            update: (view, prevState) => {
              if (view.state.doc !== prevState.doc && isAddKeyTriggered) {
                console.error("🕶️🕶️🕶️🕶️",isAddKeyTriggered)
                const { from, to } = view.state.selection;
                const nodes = [];
                view.state.doc.nodesBetween(from, to, (node, pos) => {
                  nodes.push({ node, pos });
                });

                // `onNodeChange` 호출
                onNodeChange({ nodes, editor: this.editor });
              }
            },
          };
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});

<script lang="ts">
  import { onMount } from "svelte";

  export let content = "<table><tr><td>This is the first sentence.</td><td>This is the second sentence.</td></tr></table>";
  export let highlightText = "the first sentence.This is the second";

  let container:HTMLDivElement
  onMount(() => {
    highlight(container, highlightText);
  });

  function highlight(element: Node, text: string): void {
    const flatText = element.textContent as string;

    let start = flatText.indexOf(text);
    let end = start + text.length;

    if (start === -1) return;

    let currentIndex = 0;

    function traverse(node: Node) {
      if (currentIndex > end) return;
      if (node.nodeType === 3) { // Text node
        const nodeValue = node.nodeValue as string;
        const nodeLength = nodeValue.length;

        if (currentIndex + nodeLength >= start && currentIndex <= end) {
          const highlightedSpan = document.createElement("span");
          highlightedSpan.className = "highlight";
          const beforeText = nodeValue.substring(0, start - currentIndex);
          const highlightedText = nodeValue.substring(start - currentIndex, end - currentIndex);
          const afterText = nodeValue.substring(end - currentIndex);
          highlightedSpan.textContent = highlightedText;

          const beforeNode = document.createTextNode(beforeText);
          const afterNode = document.createTextNode(afterText);

          node.parentNode?.insertBefore(beforeNode, node);
          node.parentNode?.insertBefore(highlightedSpan, node);
          node.parentNode?.insertBefore(afterNode, node);
          node.parentNode?.removeChild(node);

          start = -1; // Reset the start index to avoid further matching
        }

        currentIndex += nodeLength;
      } else { // Element node
        let i = 0;
        while (i < node.childNodes.length) {
          traverse(node.childNodes[i]);
          i++;
        }
      }
    }

    traverse(element);
  }
</script>

<style>
  .highlight {
    background-color: yellow;
  }
</style>

<div bind:this={container}>
  {@html content}
</div>

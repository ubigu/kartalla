// jsdom doesn't implement canvas — mock it to silence "Not implemented" warnings
HTMLCanvasElement.prototype.getContext = () => null;

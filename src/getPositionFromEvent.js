const getTouchPosition = ({ touches }) => touches[touches.length - 1];

export default (event) => {
  const { pageX, pageY } = event.touches ? getTouchPosition(event) : event;
  const result = {
    pointerX: pageX,
    pointerY: pageY,
  };
  return result;
};

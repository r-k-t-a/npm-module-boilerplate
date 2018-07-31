import { cloneElement, Component } from 'react';
import PropTypes from 'prop-types';
import mergeProps from 'react-merge-props-and-styles';

import getPositionFromEvent from './getPositionFromEvent';

const NULL_INDEX = -1;

export default class Sortable extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      activeElementIndex: NULL_INDEX,
      dragOverIndex: NULL_INDEX,
      pointerX: 0,
      pointerY: 0,
      fixX: 0,
      fixY: 0,
    };
    this.itemRefs = [];
  }
  componentDidMount() {
    window.addEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  componentWillUpdate(nextProps, { dragOverIndex }) {
    if (dragOverIndex !== this.state.dragOverIndex) this.props.onSortMove(dragOverIndex);
    this.itemRefs = this.nullRefs;
  }
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  get children() { return this.props.children; }
  get ghost() {
    const {
      activeElementIndex,
      pointerX,
      fixX,
      pointerY,
      fixY,
    } = this.state;
    if (activeElementIndex === NULL_INDEX) return null;
    const activeChild = this.props.children[activeElementIndex];
    const activeRef = this.itemRefs[activeElementIndex];
    const currentProps = {
      key: 'rkta-sortable-ghost',
      style: {
        width: activeRef && activeRef.clientWidth,
        height: activeRef && activeRef.clientHeight,
        left: pointerX - fixX,
        top: pointerY - fixY,
        position: 'absolute',
      },
    };
    const nextProps = mergeProps(activeChild.props, currentProps, this.props.ghostProps);
    return cloneElement(activeChild, nextProps);
  }
  get nullRefs() {
    return this.props.children.map((child, key) => this.itemRefs[key] || NULL_INDEX);
  }
  makeBeginHandler = activeElementIndex => (event) => {
    const { pointerX, pointerY } = getPositionFromEvent(event);
    const { offsetLeft, offsetTop } = event.target;
    const fixX = pointerX - offsetLeft;
    const fixY = pointerY - offsetTop;
    this.setState({
      activeElementIndex,
      pointerX,
      pointerY,
      fixX,
      fixY,
    });
    event.stopPropagation();
  };
  makeRefHandler = key => (ref) => {
    if (ref) this.itemRefs[key] = ref;
  }
  handleDrag = (event) => {
    if (this.state.activeElementIndex === NULL_INDEX) return;
    const pointer = getPositionFromEvent(event);
    const intersect = (node) => {
      const y1 = node.offsetTop;
      const y2 = y1 + node.offsetHeight;
      return y1 < pointer.pointerY && pointer.pointerY < y2;
    };
    const dragOverIndex = this.itemRefs.findIndex(intersect);
    this.setState({ ...pointer, dragOverIndex });
    event.stopPropagation();
  }
  handleDragEnd = () => {
    const { activeElementIndex, dragOverIndex } = this.state;
    if (dragOverIndex !== NULL_INDEX && dragOverIndex !== activeElementIndex) {
      this.props.onSortComplete(activeElementIndex, dragOverIndex);
    }
    this.setState({
      activeElementIndex: NULL_INDEX,
      dragOverIndex: NULL_INDEX,
    });
  };
  cloneChild = (child, key) => {
    const { activeElementIndex, dragOverIndex } = this.state;
    const currentProps = {
      key,
      [this.props.refInterface]: this.makeRefHandler(key),
      onPointerDown: this.makeBeginHandler(key),
      onTouchStart: this.makeBeginHandler(key),
      onTouchEnd: this.handleDragEnd,
      onTouchCancel: this.handleDragEnd,
      onTouchMove: this.handleDrag,
    };

    const emmiterProps = key === activeElementIndex ? this.props.emmiterProps : {};
    const receiverProps = key === dragOverIndex && key !== activeElementIndex
      ? this.props.receiverProps
      : {};
    const nextProps = mergeProps(child.props, emmiterProps, receiverProps, currentProps);
    return cloneElement(child, nextProps);
  };
  render = () => this.props.children.map(this.cloneChild).concat(this.ghost)
}

Sortable.propTypes = {
  children: PropTypes.node.isRequired,
  emmiterProps: PropTypes.shape(),
  ghostProps: PropTypes.shape(),
  onSortComplete: PropTypes.func,
  onSortMove: PropTypes.func,
  receiverProps: PropTypes.shape(),
  refInterface: PropTypes.string,
};
Sortable.defaultProps = {
  emmiterProps: {},
  ghostProps: {},
  receiverProps: {},
  refInterface: 'ref',
  onSortComplete: () => null,
  onSortMove: () => null,
};

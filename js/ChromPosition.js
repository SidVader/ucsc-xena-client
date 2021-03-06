'use strict';

var widgets = require('./columnWidgets');
var React = require('react');
var ReactDOM = require('react-dom');
var vgcanvas = require('./vgcanvas');
var {addCommas} = require('./util');

var height = 24; // Move to common file, to match refGeneExons? Pass in as prop?
var labelHeight = 12;
var font = 10;

function metric(n) {
	var str = String(n);
	if (str.match(/000000$/)) {
		str = str.replace(/000000$/, 'Mb');
	} else if (str.match(/000$/)) {
		str = str.replace(/000$/, 'kb');
	}
	return str;
}

function pickRange(size) {
	return Math.pow(10, Math.floor(Math.log(size) / Math.log(10)));
}

function abrev(n) {
	var s = String(n);
	return {
		1: s => s,
		2: s => s,
		3: s => s,
		4: s => `${s[0]}.${s[1]}k`,
		5: s => `${s.slice(0, 2)}k`,
		6: s => `${s.slice(0, 3)}k`,
		7: s => `${s[0]}.${s[1]}M`,
		8: s => `${s.slice(0, 2)}M`,
		9: s => `${s.slice(0, 3)}M`,
	}[s.length](s);
}

function numberOrAbrev(vg, width, font, n) {
	var s = addCommas(n),
		w = vg.textWidth(font, s + ' '); // pad with one space
	return w > width ? abrev(n) : s;
}

function drawChromScale(vg, width, layout) {
	if (vg.width() !== width) {
		vg.width(width);
	}
	vg.box(0, 0, width, height, 'white'); // white background
	if (!layout) {
		return;
	}

	var [baseStart, baseEnd] = layout.chrom[0],
		[pixelStart, pixelEnd] = layout.screen[0],
		pixelWidth = pixelEnd - pixelStart,
		baseWidth = baseEnd - baseStart + 1,
		range = pickRange(baseWidth / 2),
		rangeWidth = pixelWidth * range / baseWidth,
		endText = numberOrAbrev(vg, width / 2, font, baseEnd),
		rangeText = metric(range),
		rangeTextWidth = vg.textWidth(font, rangeText),
		pushLeft = Math.max(width - rangeTextWidth - rangeWidth - 1, 0),
		rangePos = Math.min(pushLeft, (pixelWidth - rangeWidth) / 2);

	// Render start & end position, abreviating if constrained for width.
	vg.text(pixelStart + 3, height - 1, 'black', font, numberOrAbrev(vg, width / 2, font, baseStart));    // start position at left
	vg.text(pixelEnd - vg.textWidth(font, endText), height - 1, 'black', font, endText); // end position at right


	if (range >= 1) {
		// Render centered scale, pushing to left if constrained for width.
		vg.box(rangePos, labelHeight / 2, rangeWidth, 1, 'black');
		vg.box(rangePos, 0, 1, labelHeight, 'black');
		vg.box(rangePos + rangeWidth, 0, 1, labelHeight, 'black');
		vg.text(rangePos + rangeWidth + 1, labelHeight - font / 4, 'black', font, rangeText);
	}
}

var ChromPosition = React.createClass({
	shouldComponentUpdate: () => false,
	componentDidMount() {
		var {width, layout} = this.props;
		this.vg = vgcanvas(ReactDOM.findDOMNode(this.refs.canvas), width, height);
		drawChromScale(this.vg, width, layout);
	},
	componentWillReceiveProps(props) {
		var {width, layout} = props;
		drawChromScale(this.vg, width, layout);
	},
	render() {
		return (
			<canvas
				className='Tooltip-target'
				onMouseMove={this.props.onMouseMove}
				onMouseOut={this.props.onMouseOut}
				onMouseOver={this.props.onMouseOver}
				onClick={this.props.onClick}
				onDblClick={this.props.onDblClick}
				ref='canvas' />);
	}

});

widgets.annotation.add('chrom', props => <ChromPosition {...props}/>);

module.exports = {ChromPosition, abrev};

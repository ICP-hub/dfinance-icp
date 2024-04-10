import React from 'react'
import { EllipseProps } from '../../utils/types';

const Ellipse: React.FC<EllipseProps> = ({ position, width, height, fill, props }) => {

    switch (position) {
        case 'top-right':
            return (
                <svg width={width || 500} height={height || 500} viewBox="0 0 620 643" fill={fill} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="454.591" cy="188.591" r="453.638" transform="rotate(15 454.591 188.591)" fill="#8CC0D7" fill-opacity="0.14" />
                </svg>
            )
        case 'middle-right':
            return (
                <svg width={width || 400} height={height || 900} viewBox="0 0 443 909" fill={fill} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="-11.4089" cy="454.591" r="453.638" transform="rotate(15 -11.4089 454.591)" fill="#8CC0D7" fill-opacity="0.15" />
                </svg>
            )
        case 'bottom-right':
            return (
                <svg width={width || 600} height={height || 900} viewBox="0 0 643 909" fill={fill} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="454.591" cy="454.591" r="453.638" transform="rotate(15 454.591 454.591)" fill="#8CC0D7" fill-opacity="0.2" />
                </svg>
            )
        case 'bottom-left':
            return (
                <svg width={width || 450} height={height || 550} viewBox="0 0 443 526" fill={fill} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="-11.4089" cy="454.591" r="453.638" transform="rotate(15 -11.4089 454.591)" fill="#8CC0D7" fill-opacity="0.15" />
                </svg>
            )
        default:
            return (
                <span>Please specifiy ellipse position</span>
            )
    }

}

export default Ellipse
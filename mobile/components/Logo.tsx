import React from 'react';
import Svg, { Circle, Path, G, Text as SvgText, TextPath, Defs } from 'react-native-svg';

interface LogoProps {
    size?: number;
    style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 100, style }) => {
    return (
        <View style={style}>
            <Svg width={size} height={size} viewBox="0 0 200 200">
                {/* Circular Background */}
                <Circle cx="100" cy="100" r="95" fill="#0a0012" stroke="#d4af37" strokeWidth="2"/>
                
                {/* Outer Glow */}
                <Circle cx="100" cy="100" r="98" stroke="#d4af37" strokeWidth="0.5" strokeOpacity="0.3"/>

                <Defs>
                    <Path id="topTextPath" d="M 40 100 A 60 60 0 0 1 160 100" />
                    <Path id="bottomTextPath" d="M 30 100 A 70 70 0 0 0 170 100" />
                </Defs>

                <SvgText fill="#d4af37" fontSize="18" fontWeight="900">
                    <TextPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                        SLICK TRENDS
                    </TextPath>
                </SvgText>

                <SvgText fill="#b8a9d0" fontSize="10" fontWeight="600">
                    <TextPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
                        QUALITY ROBES ONESIES
                    </TextPath>
                </SvgText>

                <G transform="translate(55, 75) scale(0.6)">
                    <Path d="M 25 5 Q 25 0 30 0 Q 35 0 35 5 Q 35 10 30 10 M 10 20 L 50 20" stroke="#d4af37" strokeWidth="3" fill="none" />
                    <Path d="M 15 20 L 5 80 L 55 80 L 45 20 Z" fill="#d4af37"/>
                </G>

                <G transform="translate(100, 75) scale(0.6)">
                    <Path d="M 15 20 Q 30 0 45 20" stroke="#d4af37" strokeWidth="4" fill="none" />
                    <Path d="M 15 20 L 10 60 L 25 80 L 35 80 L 50 60 L 45 20 Z" fill="#d4af37"/>
                </G>
                
                <Circle cx="45" cy="100" r="2" fill="#d4af37"/>
                <Circle cx="155" cy="100" r="2" fill="#d4af37"/>
            </Svg>
        </View>
    );
};

// Wrap with View for style support
import { View } from 'react-native';

export default Logo;

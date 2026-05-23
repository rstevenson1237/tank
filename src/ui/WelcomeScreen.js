export class WelcomeScreen {
    draw(renderer, t) {
        const w = renderer.width;
        const h = renderer.height;

        const pulse = 0.7 + 0.3 * Math.sin(t * 2);
        renderer.drawGlowText('D-ZONE', w / 2, h * 0.15, `rgba(0,255,136,${pulse})`, 52, 'center', 30);
        renderer.drawText('DESTRUCTION ZONE', w / 2, h * 0.15 + 50, '#444444', 9, 'center');

        const colX = [w * 0.17, w * 0.5, w * 0.83];
        const colColors = ['#00ffff', '#ff2244', '#ffcc00'];
        const headerY = h * 0.38;

        renderer.drawGlowText('PLAYER 1', colX[0], headerY, colColors[0], 7, 'center', 6);
        renderer.drawGlowText('PLAYER 2', colX[1], headerY, colColors[1], 7, 'center', 6);
        renderer.drawGlowText('PLAYER 3', colX[2], headerY, colColors[2], 7, 'center', 6);

        const rows = [
            ['W  forward',    '↑  forward',    'I  forward'],
            ['S  reverse',    '↓  reverse',    'K  reverse'],
            ['A  turn left',  '←  turn left',  'J  turn left'],
            ['D  turn right', '→  turn right', 'L  turn right'],
            ['SPACE  fire',   'ENTER  fire',   'R-SHIFT  fire'],
            ['Q/E  weapons',  '4/6  weapons',  'U/O  weapons'],
        ];

        const rowStartY = headerY + 30;
        const rowH = 24;

        rows.forEach((row, i) => {
            row.forEach((text, j) => {
                renderer.drawText(text, colX[j], rowStartY + i * rowH, colColors[j], 6, 'center');
            });
        });

        const hintY = rowStartY + rows.length * rowH + 24;
        renderer.drawText('Arrow keys + ENTER work in all menus', w / 2, hintY, '#446644', 6, 'center');

        const pressPulse = 0.5 + 0.5 * Math.sin(t * 3);
        renderer.drawGlowText('[ PRESS ANY KEY ]', w / 2, hintY + 44, `rgba(0,255,136,${pressPulse})`, 10, 'center', 12);
    }
}

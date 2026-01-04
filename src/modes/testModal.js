/**
 * Test modal for networked mode
 * Creates a modal that can be used to test the modal system in multiplayer mode
 */

import { Modal } from '../ui/Modal.js';
import { clientLogger } from '../utils/clientLogger.js';

/**
 * Create a test modal for networked mode
 * @param {Object} dependencies - Dependencies needed for modal actions
 * @param {Object} dependencies.inputHandler - Input handler instance
 * @param {Object} dependencies.wsClient - WebSocket client instance
 * @param {Object} dependencies.game - Game instance
 * @param {Function} dependencies.setRunning - Function to set running state
 * @returns {Modal} Configured test modal instance
 */
export function testModal({ inputHandler, wsClient, game, setRunning }) {
    return new Modal({
        title: 'Network Test',
        action: () => {
            clientLogger.info('Process the form data');
        },
        content: [
            { type: 'message', text: 'Connected to server!' },
            {
                type: 'option',
                label: 'Hello',
                action: () => {
                    clientLogger.info('This is a test modal option');
                    // Modal will close automatically after action
                },
            },
            { type: 'message', text: 'This is a test modal in networked mode.' },
            {
                type: 'option',
                label: 'Close',
                action: (options) => {
                    const { modal } = options;
                    clientLogger.info('Close option selected');
                    if (modal?.action) modal.action();

                    // Modal will close automatically after action
                },
            },
            {
                type: 'option',
                label: 'Quit',
                action: () => {
                    if (inputHandler) {
                        inputHandler.stop();
                    }
                    if (wsClient) {
                        wsClient.sendDisconnect();
                        wsClient.disconnect();
                    }
                    if (setRunning) {
                        setRunning(false);
                    }
                    if (game) {
                        game.stop();
                    }
                },
            },
            { type: 'message', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sit amet tincidunt massa. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Pellentesque. Nunc sagittis ligula id tellus mattis, id hendrerit dolor venenatis. Sed id ultricies dui.' },
            { type: 'message', text: 'Quisque feugiat, enim euismod aliquet rhoncus, ex lectus lobortis nulla, sit amet pretium tortor dola. Nam sodales viverra justo, in feugiat nulla dictum nec. Nullam suscipit, nibh quis cursus bibendum, felis orci eleifend augue, quis cursus dolor.' },
            { type: 'message', text: 'Aenean magna velit, dictum id felis nec, ornare rutrum sem. Suspendisse vel feugiat lorem, a ornare dui. Mauris rhoncus enim pariona dictum facilisis. Pellentesque eu blandit arcu, in dictum nunc. Etiam leo lorem, lacinia ac sollicitudin volutpat.' },
        ],
    });
}

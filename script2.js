const _config = {
    selectBot: 'DeepSeekBot', // 默认选择的 bot
    llms: {
        DeepSeek: {
            type: 'deepseek',
            token: process.env.DEEPSEEK_TOKEN || '', // 使用环境变量
            url: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat',
            models: ['deepseek-chat'],
            note: 'DeepSeek API requires an API key, ensure your token is correct.'
        },
        Gemini: {
            type: 'gemini',
            token: process.env.GEMINI_TOKEN || '', // 使用环境变量
            url: 'https://generativelanguage.googleapis.com/v1beta/models/__MODEL_NAME__:generateContent',
            model: 'gemini-2.0-flash-exp',
            models: ['gemini-2.0-flash-exp', 'gemini-pro-vision', 'gemini-1.0-pro-001'],
            note: 'Gemini API requires an API key and requires using generateContent endpoint.'
        },
        OpenAI: {
            type: 'openai',
            token: process.env.OPENAI_TOKEN || '', // 使用环境变量
            url: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o_2024-05-13',
            models: ['gpt-4o_2024-05-13', 'gpt-4-turbo-preview', 'gpt-4', 'gpt-4-0613', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0613'],
            note: 'OpenAI API requires an API key, ensure your token is correct.'
        },
        Claude: {
            type: 'claude',
            token: process.env.CLAUDE_TOKEN || '', // 使用环境变量
            url: 'https://api.anthropic.com/v1/messages',
            headers: { 'anthropic-version': '2023-10-01' },
            model: 'claude-3-opus-20240229',
            models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-2.1', 'claude-2'],
            note: 'Claude API requires an API key, ensure your token is correct.'
        },
        XAI: {
            type: 'xai',
            token: process.env.XAI_TOKEN || '', // 使用环境变量
            url: 'https://api.x.ai/v1/chat/completions',
            model: 'grok-1',
            models: ['grok-2-latest', 'grok-beta'],
            note: 'XAI API requires an API key, ensure your token is correct. Use grok-1 rather than grok-beta'
        }
    },
    bots: {
        XAIBot: {
            llm: 'XAI',
            model: 'grok-2-latest',
            system: 'chatbot for XAI',
        },
        DeepSeekBot: {
            llm: 'DeepSeek',
            model: 'deepseek-chat',
            system: '你是一个有用的助手',
        },
        OpenAIBot: {
            llm: 'OpenAI',
            model: 'gpt-4o_2024-05-13',
            system: '你是一个有用的助手',
        },
        ClaudeBot: {
            llm: 'Claude',
            model: 'claude-3-opus-20240229',
            system: '你是一个有用的助手',
        },
        GeminiBot: {
            llm: 'Gemini',
            model: 'gemini-2.0-flash-exp',
            system: '你是一个有用的助手',
        }
    }
};

// https://github.com/f/awesome-chatgpt-prompts
// https://www.cnblogs.com/pDJJq/p/18296376/system-prompt-crack-2pocjl
// https://weam.ai/blog/prompts/best-system-prompts-for-chatgpt/

const sessionHistory = document.getElementById('session-history');
const chatMessages = document.getElementById('chat-history'); // 添加 chatMessages 的引用
const inputResizeHandle = document.getElementById('input-resize-handle'); // 添加 inputResizeHandle 的引用
const messageInput = document.getElementById('message-input'); // 添加 messageInput 的引用

/**
 * @typedef {Object} AIMessageContent
 * @property {'text' | 'image'} type - 消息内容的类型（文本或图片）
 * @property {string} [text] - 文本内容（type 为 'text' 时存在）
 * @property {Object} [source] - 图片内容（type 为 'image' 时存在）
 * @property {'base64'} source.type - 图片数据的类型
 * @property {string} source.mime_type - 图片的 MIME 类型
 * @property {string} source.data - 图片的 base64 数据
 */

/**
 * @typedef {Object} AIMessageInfo
 * @property {'user' | string} role - 消息的角色（'user' 或 LLM 的名称）
 * @property {AIMessageContent[]} content - 消息内容数组
 */

class Resizable {
    constructor(element, handle, options = {}) {
        this.element = element;
        this.handle = handle;
        this.minHeight = options.minHeight || 100;
        this.maxHeight = options.maxHeight || 300;
        this.isResizing = false;
        this.startY = 0;
        this.startHeight = 0;

        this.handle.addEventListener('mousedown', this._initResize.bind(this));
        document.addEventListener('mousemove', this._resize.bind(this));
        document.addEventListener('mouseup', this._stopResize.bind(this));
        this.handle.addEventListener('selectstart', (e) => e.preventDefault());
    }

    _initResize(e) {
        this.isResizing = true;
        this.startY = e.clientY;
        this.startHeight = parseInt(document.defaultView.getComputedStyle(this.element).height, 10);
        e.preventDefault();
    }

    _resize(e) {
        if (!this.isResizing) return;
        const deltaY = e.clientY - this.startY;
        const newHeight = this.startHeight - deltaY;

        if (newHeight > this.minHeight && newHeight < this.maxHeight) {
            this.element.style.height = `${newHeight}px`;
        }
    }

    _stopResize() {
        this.isResizing = false;
    }
}

class InputHandler {
    constructor(inputElement, containerElement, uploadButton, fileInput) {
        this.inputElement = inputElement;
        this.containerElement = containerElement;
        this.uploadButton = uploadButton;
        this.fileInput = fileInput;
        this.init();
    }

    init() {
        this.inputElement.addEventListener('dragover', (e) => e.preventDefault());
        this.inputElement.addEventListener('drop', (e) => this._handleDrop(e));
        this.inputElement.addEventListener('paste', (e) => this._handlePaste(e));

        // 绑定文件上传按钮点击事件
        this.uploadButton.addEventListener('click', () => this.fileInput.click());

        // 绑定文件输入框变化事件
        this.fileInput.addEventListener('change', (e) => this._handleFileUpload(e));
    }

    _handleDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            this._addFileIcon(file);
        }
    }

    _handlePaste(e) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    this._addFileIcon(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    }

    _handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this._addFileIcon(file);
        }
        // 清空文件输入框，以便再次选择同一文件
        e.target.value = '';
    }

    _addFileIcon(file) {
        const fileIconContainer = document.createElement('div');
        fileIconContainer.classList.add('file-icon');

        const fileIcon = document.createElement('img');
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileIcon.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            fileIcon.src = 'https://via.placeholder.com/50'; // Placeholder image for non-image files
        }
        fileIcon.alt = file.name;

        const deleteIcon = document.createElement('div');
        deleteIcon.classList.add('delete-icon');
        deleteIcon.textContent = '×';
        deleteIcon.addEventListener('click', () => {
            fileIconContainer.remove();
        });

        fileIconContainer.appendChild(fileIcon);
        fileIconContainer.appendChild(deleteIcon);

        // 直接存储 File 对象
        fileIconContainer.file = file;


        this.containerElement.insertBefore(fileIconContainer, this.containerElement.lastElementChild);
    }

    async _getAttachments() {
        const attachments = [];
        const fileIcons = document.querySelectorAll('.file-icon');
        for (const icon of fileIcons) {
            const file = icon.file; // 直接获取 File 对象
            if (file && file.name && file.type) {
                const base64Data = await this._readFileAsBase64(file);
                attachments.push({
                    name: file.name,
                    type: this._getTypeFromMimeType(file.type),
                    mime_type: file.type,
                    data: base64Data
                });
            } else {
                console.warn('Skipping invalid file data:', file);
            }
        }
        return attachments;
    }
    _getTypeFromMimeType(mimeType) {
        if (!mimeType || typeof mimeType !== 'string') {
            return null;
        }
        const parts = mimeType.split('/');
        if (parts.length === 2) {
            return parts[1];
        }
        return null;
    }
    _readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    _clearAttachments() {
        const fileIcons = document.querySelectorAll('.file-icon');
        fileIcons.forEach(icon => icon.remove());
    }
    
    async getInput() {
        const text = this.inputElement.value.trim();
        const server = this._config2ReqInfo();
        const attachments = await this._getAttachments();

        if ((text === '' && attachments.length === 0) || !server) {
            return;
        }

        // 构建 AIMessageInfo
        const message = {
            role: 'user',
            content: [
                { type: 'text', text: text },
                ...attachments.map(attachment => ({
                    type: attachment.type,
                    source: { type: 'base64', mime_type: attachment.mime_type, data: attachment.data }
                }))
            ]
        };

        return { server, message };
    }

    clearInput() {
        this.inputElement.value = '';
        this._clearAttachments();
    }

    _config2ReqInfo() {
        const selectedBot = _config.bots[_config.selectBot];
        const llmConfig = _config.llms[selectedBot.llm];

        let headers = {
            'Content-Type': 'application/json',
        };

        let contextName = 'assistant';
        let url = llmConfig.url;
        let body = {
            model: selectedBot.model,
            stream: true
        };

       if(llmConfig.type === 'gemini'){
        body = {};
        contextName = 'model';
        url = url.replace('__MODEL_NAME__', selectedBot.model);
            headers['x-goog-api-key'] = llmConfig.token;
       }else{
           headers['Authorization'] = `Bearer ${llmConfig.token}`
       }
       headers = {...headers, ...llmConfig.headers};

        return {
            url: url,
            method: 'POST',
            headers: headers,
             llm: llmConfig,
            name: selectedBot.llm,
            contextName,
            body: body
        };
    }
}

class MessageRender {
    /**
     * @param {HTMLElement} chatElement - 聊天界面的 DOM 元素
     */
    constructor(chatElement) {
        this.chatElement = chatElement;
    }

    async onStreamAck(svrInfo, reader, errorInfo) {
        if (errorInfo) {
            this.appendMessage(errorInfo);
            return;
        }

        const assistantMessageElement = document.createElement('div');
        assistantMessageElement.classList.add('chat-message', 'assistant-message');
        assistantMessageElement.innerHTML = `<div class="message-text"><strong>${svrInfo.name}:</strong> </div>`;
        this.chatElement.appendChild(assistantMessageElement);
        let assistantResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            let contents = [];
            const textChunk = new TextDecoder().decode(value);
            try {
                if (textChunk.startsWith('data:')) {
                    const lines = textChunk.split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        if (line.trim().endsWith('[DONE]')) continue;
                        const jsonData = JSON.parse(line.substr(5));
                        const content = jsonData.choices[0].delta.content || '';
                        contents.push(content);
                    }
                } else {
                    const obj = JSON.parse(textChunk);
                    const content = obj?.candidates?.[0]?.content?.parts?.[0].text || '';
                    contents.push(content);
                }
            } catch (error) {
                console.error('解析 JSON 时出错:', error);
                contents.push(textChunk)
            }

            for (const content of contents) {
                assistantResponse += content;
                const innerHTML = `<strong>${svrInfo.name}:</strong> ${marked.parse(assistantResponse)}`;
                assistantMessageElement.querySelector('.message-text').innerHTML = innerHTML;


                assistantMessageElement.querySelectorAll('pre code').forEach((block) => {
                    if (!block.classList.contains('hljs')) {
                        hljs.highlightElement(block);
                    }
                });

                this.chatElement.scrollTop = this.chatElement.scrollHeight;
            }
        }
        return {role:'assistant',content:[{type: 'text',text: assistantResponse}]};
    }

    /**
     * 渲染消息到聊天界面
     * @param {AIMessageInfo} messageInfo - 消息信息
     */
    appendMessage(messageInfo) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${messageInfo.role}-message`);

        let messageContent = `<strong>${messageInfo.role === 'user' ? 'User' : messageInfo.role}:</strong> `;

        messageInfo.content.forEach(item => {
            if (item.type === 'text') {
                messageContent += this._escapeHtml(item.text).replace(/\n/g, '<br>');
            } else if (item.type === 'image') {
                messageContent += `<br><img src="data:${item.source.mime_type};base64,${item.source.data}" alt="Attached Image" style="max-width: 200px;">`;
            }
        });

        messageElement.innerHTML = `<div class="message-text">${messageContent}</div>`;
        this.chatElement.appendChild(messageElement);
        this.chatElement.scrollTop = this.chatElement.scrollHeight;
    }

    /**
     * 转义 HTML 特殊字符
     * @param {string} unsafe - 未转义的字符串
     * @returns {string} 转义后的字符串
     */
    _escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

class MessageSender {
    /**
     * @param {HTMLElement} loadingIndicator - 加载指示器的 DOM 元素
     * @param {MessageRender} messageRenderer - 消息渲染器实例
     */
    constructor(loadingIndicator, messageRenderer) {
        this.loadingIndicator = loadingIndicator;
        this.messageRenderer = messageRenderer;
    }



    _toReqMessage(llm, messageInfo) {
        switch(llm.type){
            case 'deepseek':
                return {
                    messages: messageInfo.map(message => ({
                        role: message.role,
                        content: message.content?.[0]?.text,
                    })),
                };
            case 'openai':
            case 'claude':
                return {
                    messages: messageInfo.map(message => ({
                        role: message.role,
                        content: message.content.filter(item => item.type === 'text').map(item => item.text).join(" "),
                    })),
                };
            case 'gemini':
                return {
                    contents: messageInfo.map(message => ({
                        role: message.role === 'user' ? 'user' : 'model',
                        parts:
                            message.content.map(item => {
                            if (item.type === 'text') {
                                return { text: item.text };
                            } else {
                                return {
                                    inlineData: {
                                        mimeType: `${item.source.mime_type}`,
                                        data: item.source.data,
                                    },
                                };
                            }
                        }).filter(item => item)
                    }))
                };

                case 'xai':
                    return {messages: messageInfo.map(message => ({
                            role: message.role,
                        content: message.content.map(item => {
                            if (item.type === 'text') {
                                return { type: 'text', text: item.text };
                            } else if (item.type === 'image') {
                                return {
                                    type: 'image_url',
                                    image_url: {
                                        "url": `data:${item.source.mime_type};base64,${item.source.data}`,
                                        //"detail": "high",
                            },
                    };
                            }
                        }),
                    }))};

        default:
            return {
                messages: messageInfo.map(message => ({
                    role: message.role,
                    content: message.content.map(item => {
                        if (item.type === 'text') {
                            return { type: 'text', text: item.text };
                        } else if (item.type === 'image') {
                            return { type: 'image_url', image_url: { url: `data:${item.source.mime_type};base64,${item.source.data}` } };
                        }
                    }).filter(item => item)
                })),
            };
        }
    }

    /**
     * 发送消息并处理服务器响应
     * @param {Object} svrInfo - 服务器配置信息
     * @param {AIMessageInfo} messageInfo - 消息信息
     */
    async sendMessage(svrInfo, messageInfo) {
        let body = {...this._toReqMessage(svrInfo.llm, messageInfo),...svrInfo.body};
        this.loadingIndicator.classList.remove('hidden');

        try {
            const response = await fetch(svrInfo.url, {
                method: svrInfo.method || 'POST', // 默认使用 POST 方法
                headers: {
                    'Content-Type': 'application/json',
                    ...svrInfo.headers
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    return {
                        undefined, errorInfo: {
                            role: 'assistant',
                            content: [{ type: 'text', text: `Error: ${errorData.error.message || JSON.stringify(errorData) || 'Unknown error'}` }]
                        }
                    };
                } else {
                    const errorText = await response.text();
                    return {
                        undefined, errorInfo: {
                            role: 'assistant',
                            content: [{ type: 'text', text: `Error: ${errorText}` }]
                        }
                    };
                }
            }

            const reader = response.body.getReader();
            return { reader, errorInfo: undefined };
        } catch (error) {
            console.error('Error:', error);
            return {
                undefined, errorInfo: {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'An error occurred while processing your request.' }]
                }
            };
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }

}

class ChatApp {
    constructor() {
        this.historyMessage = [];
        this.inputElement = document.getElementById('message-input');
        this.chatElement = document.getElementById('chat-history');
        this.loadingIndicator = document.getElementById('loading');
        this.aiSelector = document.getElementById('ai-selector-1');
        this.aiSysprompt = document.getElementById('ai-sysprompt');

        this.fileHandler = new InputHandler(
            this.inputElement,
            document.getElementById('input-container'),
            document.getElementById('upload-button'),
            document.getElementById('file-upload')
        );

        // 初始化 MessageRender 和 MessageSender
        this.messageRenderer = new MessageRender(this.chatElement);
        this.messageSender = new MessageSender(this.loadingIndicator, this.messageRenderer);

        this.init();
    }

    init() {
        this._initBotSelector();
        document.getElementById('send-button').addEventListener('click', () => this.handleSend());
        this.inputElement.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                this.handleSend();
            }
        });
    }

    _initBotSelector() {
        this.aiSelector.innerHTML = '';
        Object.keys(_config.bots).forEach(botName => {
            const option = document.createElement('option');
            option.value = botName;
            option.textContent = botName;
            this.aiSelector.appendChild(option);
        });
        this.aiSelector.value = _config.selectBot;
        this._updateAiSysprompt();
        this.aiSelector.addEventListener('change', () => {
            _config.selectBot = this.aiSelector.value;
            this._updateAiSysprompt();
        });
    }

    _updateAiSysprompt() {
        const selectedBot = _config.bots[_config.selectBot];
        if (selectedBot && selectedBot.system) {
            this.aiSysprompt.textContent = selectedBot.model + ': ' + selectedBot.system;
        } else {
            this.aiSysprompt.textContent = 'No system prompt available.';
        }
    }

    async handleSend() {
        const inputInfo = await this.fileHandler.getInput();

        if (!inputInfo) {
            return;
        }

        // 渲染用户消息
        this.messageRenderer.appendMessage(inputInfo.message);

        const oldhistory = [...this.historyMessage];
        this.saveMessageToSession(inputInfo.message);

        // 发送消息
        let { reader, errorInfo } = await this.messageSender.sendMessage(inputInfo.server, this.historyMessage);
        let assistantMessage = await this.messageRenderer.onStreamAck(inputInfo.server, reader, errorInfo);
        if (!errorInfo){
            this.fileHandler.clearInput();
            this.saveMessageToSession(assistantMessage);
        }
        else{
            this.historyMessage = oldhistory;
        }
    }

    /**
     * 保存消息到会话
     * @param {AIMessageInfo} messageInfo - 消息信息
     */
    saveMessageToSession(messageInfo) {
        this.historyMessage.push(messageInfo);
        console.log('Message saved:', messageInfo);
    }
}

// 初始化应用
const chatApp = new ChatApp();

// 使用示例
const chatResizable = new Resizable(chatMessages, chatMessages, { minHeight: 100 });
const inputResizable = new Resizable(messageInput, inputResizeHandle, { minHeight: 80, maxHeight: 300 });
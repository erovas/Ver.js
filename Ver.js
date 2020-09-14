/*
 * Ver.js v1.0.0

 * Ver.js es un mini framework de JavaScript para la creación de componentes web personalizados.

 * MIT License

    Copyright (c) 2020 Emanuel Rojas Vásquez

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

 * https://github.com/erovas/Ver.js
 */
Object.defineProperty(window, "Ver", {

    value: (document => {

        //#region css DEFINICIÓN - css queries

        let queries = ['* {margin: 0; padding: 0; box-sizing: border-box; vertical-align: top}','@media screen and (min-width: 541px){}'];
        let breakPoints = ["general", "xs", "sm", "md", "lg", "xl", "lxs", "lsm", "lmd", "xlg", "xxl"];
        
        //Guarda los styles de cada breakpoint
        const stylesPoints = {};

        //Generación string de los querys
        for (let i = 180; i <= 1620; i+= 180)
            queries.push(`@media screen and (min-width: ${541+i}px){}`);
            
        //inyección de las querys en <styles>
        for (let i = 0; i < breakPoints.length; i++){
            const tag = document.createElement('style');
            tag.setAttribute('data-id', breakPoints[i]);
            stylesPoints[breakPoints[i]] = tag;
            tag.innerHTML = queries[i];
            document.head.appendChild(tag);
        }
            
        queries = breakPoints = null; //Para liberar la memoria rapidamente o eso creo

        const addCss = (breakpoint, cssString) => {
            breakpoint = breakpoint.toLowerCase();
            //cssString = cssString.trim();
            cssString = cssString;

            if(stylesPoints[breakpoint]){
                //El estilo con el query correspondiente
                const tag = stylesPoints[breakpoint];
                if(breakpoint === 'general')
                    tag.innerHTML += cssString;
                //El contenido de la query menos el ultimo corchete "}" y se setea el estilo y se cierra la query
                else
                    tag.innerHTML = tag.innerHTML.substring(0, tag.innerHTML.length - 1) + cssString + '}';
            }
        }

        //#endregion

        //#region Component DEFINICIÓN

        const Component = function(parameters){
            
            const element = parameters.element;

            //Para un tag que está en el DOM y NO está renderizado
            if(element instanceof HTMLElement){
                
                //Si el elemento NO esta renderizado
                if(!element.hasAttribute('data-render')){
                    let content = [];  //Nodos que contiene el tag sin renderizar
                    let innerText = "";  //Si NO hay nodos, entonces el texto si es que lo hay
                    
                    //Si el elemento SI tiene nodos dentro
                    if(element.children.length > 0)
                        content = Array.from(element.children);
                    //Si el elemento NO tiene nodos dentro
                    else
                        innerText = element.innerText;

                    //Se renderiza el Componente
                    element.innerHTML = parameters.html.trim();
                    element.setAttribute('data-render', '');

                    //si el elemento tenia nodos dentro se ejecutaria este loop
                    for (let i = 0; i < content.length; i++) {
                        //Elemento a añadir al componente
                        const item = content[i];
                        //si el elemento está destinado a un slot del Componente, se recupera el nombre del slot
                        const slotname = item.getAttribute('data-slot') || 'default';
                        //si el Componente tiene un elemento con ese slotname, se recupera
                        const slotContainer = element.querySelector(`[data-slot=${slotname}]`);

                        //Si existe el slot container, se agrega el elemento en él
                        if(slotContainer) {
                            //por si el elemento a agregar no tiene slot, se mete en el slot default
                            item.setAttribute('data-slot', slotname);
                            //Se agrega el elemento en el slot container
                            slotContainer.appendChild(item);
                        }
                    }

                    //si el element tiene solo texto se ejecutaria esta condición
                    if(innerText.trim() !== ""){
                        const slotContainer = element.querySelector(`[data-slot=default]`);
                        slotContainer.appendChild(document.createTextNode(innerText));
                    }

                }

                //Elemento html renderizado
                this.HTMLElement = element;
                return;
            }

            //Renderizado del Componente, porque se va a crear de cero
            const div = document.createElement('div');
            const tagName = parameters.tagName;
            div.innerHTML = `<${element}>${parameters.html.trim()}</${element}>`;
            const renderized = div.firstChild;
            renderized.setAttribute('data-render', '');

            //Elemento html generado y renderizado vacio
            this.HTMLElement = renderized;
        }

        let attributes = {
            1: ['tagName', 'classList', 'style', 'setAttribute', 'getAttribute', 'hasAttribute', 'addEventListener', 'removeEventListener', 'remove'],
            2: ['id', 'title'],
            3: ["innerText","innerHTML","textContent"],
        }

        for (let i = 0; i < attributes[1].length; i++) {
            const att = attributes[1][i];
            Object.defineProperty(Component.prototype, att, {
                get(){ return this.HTMLElement[att]; }
            });
        }

        for (let i = 0; i < attributes[2].length; i++) {
            const att = attributes[2][i];
            Object.defineProperty(Component.prototype, att, {
                get(){ return this.HTMLElement[att]; },
                set(value){ this.HTMLElement[att] = value + ''; }
            });
        }

        for (let i = 0; i < attributes[3].length; i++) {
            const att = attributes[3][i];
            Object.defineProperty(Component.prototype, att, {
                get(){
                    const component = this.HTMLElement;

                    //Si es un Componente compuesto (con varios elementos dentro)
                    if(component.children.length > 0){
                        const slotContainer = component.querySelector(`[data-slot=default]`);
                        if(slotContainer)
                            return slotContainer[att];
                        
                        return "";
                    }
                    //Si es un Componente simple (solo la etiqueta)
                    return component[att];
                },
                set(value){
                    const component = this.HTMLElement;

                    //Si es un Componente compuesto (con varios elementos dentro)
                    if(component.children.length > 0){
                        const slotContainer = component.querySelector(`[data-slot=default]`);
                        if(slotContainer)
                            return slotContainer[att] = value + '';
                        
                        return;
                    }
                    //Si es un Componente simple (solo la etiqueta)
                    return component[att] = value + '';
                }
            });
        }

        attributes = null;  //Para liberar la memoria rapidamente o eso creo

        //Retorna el Ver Component o HTMLElement encontrado con el selector
        const querySelector = (selectors, nodeRef, slot) => {

            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;
            const selector = slot? `[data-slot=${slot}] ${selectors}`: selectors+"";

            const temp = NodeRef.querySelector(selector);
                
            //Si hay algun elemento que concuerde con el selector
            if(temp){
                const tagName = temp.tagName.toLowerCase();
                
                //Si es un Ver Component, lo retorna
                if(Components[tagName])
                    return new Components[tagName](temp);
            }

            //Retorna el HTMLElement o null
            return temp;
        }

        //Retorna un array que contiene Ver Component y HTMLElement que concuerdan con el selector
        const querySelectorAll = (selectors, nodeRef, slot) => {

            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;
            const selector = slot? `[data-slot=${slot}] ${selectors}`: selectors+"";

            const temp = NodeRef.querySelector(selector);
            const out = [];

            for (let i = 0; i < temp.length; i++) {
                const item = temp[i];
                const tagName = item.tagName.toLowerCase();

                if(Components[tagName])
                    out.push(new Components[tagName](item));
                else
                    out.push(temp);
            }

            return out;
        }

        //Retorna un Ver component que concuerde con el Id
        const getComponentById = elementId => {
            const temp = document.getElementById(elementId);
                
            if(!temp) 
                return temp;

            const tagName = temp.tagName.toLowerCase();
            if(Components[tagName])
                return new Components[tagName](temp);
            
            return null;
        }

        //Retorna un Array de Ver Component que concuerde con el qualifiedName
        const getComponentsByTagName = (qualifiedName, nodeRef) => {
            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;

            const temp = NodeRef.getElementsByTagName(qualifiedName);
            const out = [];

            for (let i = 0; i < temp.length; i++) {
                const item = temp[i];
                const tagName = item.tagName.toLowerCase();

                if(Components[tagName])
                    out.push(new Components[tagName](item));
            }

            return out;
        }

        //Retorna un Array de Ver Component que concuerde con el classNames
        const getComponentsByClassName = (classNames, nodeRef) => {
            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;

            const temp = NodeRef.getElementsByClassName(classNames);
            const out = [];

            for (let i = 0; i < temp.length; i++) {
                const item = temp[i];
                const tagName = item.tagName.toLowerCase();

                if(Components[tagName])
                    out.push(new Components[tagName](item));
            }

            return out;
        }

        //Devuelve el primer Ver Component que encuentre dentro de un Ver Component o dentro de un HTMLElement
        const getFirstComponent = nodeRef => {
            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;

            const temp = NodeRef.getElementsByTagName('*');
            
            for (let i = 0; i < temp.length; i++) {
                const item = temp[i];
                const tagName = item.tagName.toLowerCase();

                if(Components[tagName])
                    return new Components[tagName](item);
            }

            return null;
        }

        //Devuelve un array de todos los Ver Component que estan dentro de un Ver Component o dentro de un HTMLElement
        const getAllComponents = nodeRef => {
            const NodeRef = nodeRef? (nodeRef.constructor === Component? nodeRef.HTMLElement : nodeRef) : document;
            
            const temp = NodeRef.getElementsByTagName('*');
            const out = [];

            for (let i = 0; i < temp.length; i++) {
                const item = temp[i];
                const tagName = item.tagName.toLowerCase();

                if(Components[tagName])
                    out.push(new Components[tagName](item));
            }

            return out;
        }

        //Devuelve el ultimo Ver Component que encuentre dentro de un Ver Component o dentro de un HTMLElement
        const getLastComponent = nodeRef => {
            const out = getAllComponents(nodeRef);
            return out[out.length - 1];
        } 

        Object.defineProperties(Component.prototype, {
            'appendChild': {
                value: function(newChild, slot = 'default'){
                    const elementNew = newChild.constructor === Component? newChild.HTMLElement: (newChild instanceof HTMLElement? newChild : false);
                    const element = this.HTMLElement;

                    if(!elementNew)
                        return null;

                    //Si es un Componente compuesto (con varios elementos dentro)
                    if(element.children.length > 0){
                        const slotContainer = element.querySelector(`[data-slot=${slot}]`);

                        if(slotContainer){
                            elementNew.setAttribute('data-slot', slot);
                            slotContainer.appendChild(elementNew);
                        }
                        else
                            return null;
                    }
                    //Si es un Componente simple (solo la etiqueta)
                    else 
                        element.appendChild(elementNew);

                    return elementNew;
                },
                writable: false
            },
            'insertBefore': {
                value: function(newChild, refChild){
                    const elementNew = newChild.constructor === Component? newChild.HTMLElement: (newChild instanceof HTMLElement? newChild : false);
                    const elementRef = refChild.constructor === Component? refChild.HTMLElement: (refChild instanceof HTMLElement? refChild : false);
                    const element = this.HTMLElement;

                    if(!elementNew || !elementRef)
                        return null;

                    slot = elementRef.getAttribute('data-slot') || 'default';

                    //Si es un Componente compuesto (con varios elementos dentro)
                    if(element.children.length > 0){
                        const slotContainer = element.querySelector(`[data-slot=${slot}]`);

                        if(slotContainer){
                            elementNew.setAttribute('data-slot', slot);
                            slotContainer.insertBefore(elementNew, elementRef);
                        }
                        else
                            return null;
                    }
                    //Si es un Componente simple (solo la etiqueta)
                    else 
                        element.insertBefore(elementNew, elementRef);

                    return elementNew;
                },
                writable: false
            },
            'insertAfter': {
                value: function(newChild, refChild){
                    const elementRef = refChild.constructor === Component? refChild.HTMLElement: (refChild instanceof HTMLElement? refChild : false);

                    if(!elementRef)
                        return null;

                    return this.insertBefore(newChild, elementRef.nextElementSibling);
                },
                writable: false
            },
            'on': {
                value: function(event, callbackfn){
                    const element = this.HTMLElement;

                    if(element['on'+event] !== undefined || callbackfn.constructor !== Function)
                        return null;

                    element['on'+event] = callbackfn;
                    
                    return callbackfn;
                },
                writable: false
            },
            'querySelector': {                
                get() {
                    const nodeRef = this.HTMLElement;
                    return (selectors, slot) => {
                        return querySelector(selectors, nodeRef, slot);
                    }
                }
            },
            'querySelectorAll': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return (selectors, slot) => {
                        return querySelectorAll(selectors, nodeRef, slot);
                    }
                }
            },
            'getComponentsByTagName': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return (qualifiedName, slot) => {

                        if(slot){

                            const slotContainer = nodeRef.querySelector(`[data-slot=${slot}]`);
                            
                            if(slotContainer)  //Si el slot existe
                                return getComponentsByTagName(qualifiedName, slotContainer);
                            
                            return [];
                        }
                            

                        return getComponentsByTagName(qualifiedName, nodeRef);
                    }
                }
            },
            'getComponentsByClassName': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return (qualifiedName, slot) => {

                        if(slot){

                            const slotContainer = nodeRef.querySelector(`[data-slot=${slot}]`);
                            
                            if(slotContainer)  //Si el slot existe
                                return getComponentsByClassName(qualifiedName, slotContainer);
                            
                            return [];
                        }

                        return getComponentsByClassName(qualifiedName, nodeRef);
                    }
                }
            },
            'getFirstComponent': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return () => {
                        return getFirstComponent(nodeRef);
                    }
                }
            },
            'getLastComponent': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return () => {
                        return getLastComponent(nodeRef);
                    }
                }
            },
            'getAllComponents': {
                get(){
                    const nodeRef = this.HTMLElement;
                    return () => {
                        return getAllComponents(nodeRef);
                    }
                }
            }
        });

        const createComponent = tagName => {
            tagName = tagName+"".toLowerCase();
            
            if(Components[tagName])
                return new Components[tagName](tagName);
            
            return null;
        }

        //#endregion

        //#region extensiones a HTMLElement

        HTMLElement.prototype.appendChildComponent = function(newChildComponent){
            if(!(newChildComponent instanceof Component))
                return null;

            this.appendChild(newChildComponent.HTMLElement);
            return newChildComponent;
        }

        HTMLElement.prototype.insertBeforeComponent = function(newChildComponent, refChild){
            if(!(newChildComponent instanceof Component))
                return null;

            this.insertBefore(newChildComponent.HTMLElement, refChild.element? refChild.element : refChild);
            return newChildComponent;
        }

        HTMLElement.prototype.insertAfterComponent = function(newChildComponent, refChild){
            return this.insertBeforeComponent(newChildComponent, refChild.element? refChild.element.nextSibling : refChild.nextSibling);
        }

        HTMLElement.prototype.querySelectorComponent = function(selectors){
            return querySelector(selectors, this, null);
        }

        HTMLElement.prototype.querySelectorAllComponent = function(selectors){
            return querySelectorAll(selectors, null, this);
        }

        HTMLElement.prototype.getComponentsByTagName = function(qualifiedName){
            return getComponentsByTagName(qualifiedName, this);
        }

        HTMLElement.prototype.getComponentsByClassName = function(classNames){
            return getComponentsByClassName(classNames, this);
        }

        HTMLElement.prototype.getFirstComponent = function(){
            return getFirstComponent(this);
        }

        HTMLElement.prototype.getLastComponent = function(){
            return getLastComponent(this);
        }

        HTMLElement.prototype.getAllComponents = function(){
            return getAllComponents(this);
        }

        //Por si se implementa legalmente algun día y no sobre escribirlo
        if(!HTMLElement.prototype.insertAfter){
            HTMLElement.prototype.insertAfter = function(newChild, refChild){
                return this.insertBefore(newChild, refChild.nextElementSibling);
            }
        }

        //#endregion

        //#region registerComponent DEFINICIÓN

        const Components = {}; //Para guardar los componentes registrados

        const registerComponent = (tagName, Constructor, styles) => {

            tagName = tagName.toLowerCase();

            //Se agrega el Componente a la colección
            if(Constructor.id === Component.id)
                Components[tagName] = Constructor;
            else {
                console.error("Constructor invalid");
                return;
            }

            //Si hay estilos para el componente, se setean
            if(styles && styles.constructor === Object)
                for (const key in styles)
                    addCss(key, styles[key]);

            renderingfn.push( ( () => {

                const elements = document.getElementsByTagName(tagName);
                let length = 0;

                return () => {

                    //Si no hay inserciones de componentes
                    if(elements.length === length)
                        return;

                    //si se ha agregado Componentes, se renderiza aquellos NO renderizados
                    for (let i = 0; i < elements.length; i++)
                        if(!elements[i].hasAttribute('data-render'))
                            new Components[tagName](elements[i]);
                        
                    length = elements.length;
                    console.log("» RENDERING: <" + tagName + ">");
                }

            })());

            //rendering inicial, si el "body" ya está disponible
            if(document.body)
                rendering();
        }

        //#endregion

        //#region rendering DEFINICIÓN

        //Guarda las funciones de renderizado de los Componentes registrados
        const renderingfn = [];

        const rendering = () => {
            for (let i = 0; i < renderingfn.length; i++)
                renderingfn[i]();
        }

        //cuando se agrega un tag al DOM que es un Componente de forma dinamica, se renderizará
        const observer = new MutationObserver(rendering);

        const render = {
            stop: observer.disconnect,
            start: () => {
                //Se renderiza los Componentes
                rendering();
                //Se activa el Observador, asi se evita que se dispare mas de una vez el "rendering()"
                observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            }
        };

        //Si Ver.js se ha cargado como "module || defer" o cargado después del 'DOMContentLoaded'
        if(document.body)
            render.start();
        else 
            document.addEventListener('DOMContentLoaded', render.start, { once: true });

        //#endregion

        return {
            registerComponent,
            Component,
            Components,
            addCss,
            createComponent,
            querySelector,
            querySelectorAll,
            getComponentById,
            getFirstComponent,
            getLastComponent,
            getAllComponents,
            getComponentsByTagName,
            getComponentsByClassName,
            render
        }

    })(document),
    writable: false
});
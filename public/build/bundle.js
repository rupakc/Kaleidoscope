
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Modal.svelte generated by Svelte v3.29.7 */

    const file = "src/components/Modal.svelte";

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p;
    	let t3;
    	let div1;
    	let a;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(/*modalHeader*/ ctx[1]);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p = element("p");
    			t3 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "Close";
    			add_location(h4, file, 10, 4, 555);
    			attr_dev(img, "class", "responsive-img");
    			attr_dev(img, "height", "700px");
    			if (img.src !== (img_src_value = "/kaleidoscope.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 11, 4, 582);
    			attr_dev(p, "class", "svelte-18bexex");
    			add_location(p, file, 12, 4, 654);
    			attr_dev(div0, "class", "modal-content svelte-18bexex");
    			add_location(div0, file, 9, 2, 523);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "modal-close waves-effect waves-green btn-flat");
    			add_location(a, file, 15, 4, 721);
    			attr_dev(div1, "class", "modal-footer");
    			add_location(div1, file, 14, 2, 690);
    			attr_dev(div2, "id", /*modalId*/ ctx[0]);
    			attr_dev(div2, "class", "modal modal-fixed-footer");
    			add_location(div2, file, 8, 0, 469);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div0, t1);
    			append_dev(div0, img);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			p.innerHTML = /*modalText*/ ctx[2];
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*modalHeader*/ 2) set_data_dev(t0, /*modalHeader*/ ctx[1]);
    			if (dirty & /*modalText*/ 4) p.innerHTML = /*modalText*/ ctx[2];
    			if (dirty & /*modalId*/ 1) {
    				attr_dev(div2, "id", /*modalId*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);
    	let { modalId = "aboutmodal" } = $$props;
    	let { modalHeader = "Kaleidoscope : A Mish-Mash of APIs for Fun" } = $$props;
    	let { modalText = "An Application Built Purely for Fun using <b> Svelte JS </b>" + "and Materlize CSS. It is truly a serverless architecture because everything is done at the client end (i.e. in browser)." + "Starting from making REST API calls to parsing the data the full stack functionality is embedded on the client side." } = $$props;
    	const writable_props = ["modalId", "modalHeader", "modalText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("modalId" in $$props) $$invalidate(0, modalId = $$props.modalId);
    		if ("modalHeader" in $$props) $$invalidate(1, modalHeader = $$props.modalHeader);
    		if ("modalText" in $$props) $$invalidate(2, modalText = $$props.modalText);
    	};

    	$$self.$capture_state = () => ({ modalId, modalHeader, modalText });

    	$$self.$inject_state = $$props => {
    		if ("modalId" in $$props) $$invalidate(0, modalId = $$props.modalId);
    		if ("modalHeader" in $$props) $$invalidate(1, modalHeader = $$props.modalHeader);
    		if ("modalText" in $$props) $$invalidate(2, modalText = $$props.modalText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [modalId, modalHeader, modalText];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { modalId: 0, modalHeader: 1, modalText: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get modalId() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalId(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalHeader() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalHeader(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalText() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalText(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Navbar.svelte generated by Svelte v3.29.7 */
    const file$1 = "src/components/Navbar.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let a0;
    	let i0;
    	let t1;
    	let ul0;
    	let li0;
    	let a1;
    	let i1;
    	let t3;
    	let li1;
    	let a2;
    	let i2;
    	let t5;
    	let li2;
    	let a3;
    	let i3;
    	let t7;
    	let li3;
    	let a4;
    	let i4;
    	let t9;
    	let ul1;
    	let li4;
    	let button;
    	let t11;
    	let li5;
    	let a5;
    	let i5;
    	let t13;
    	let modal;
    	let current;
    	modal = new Modal({ $$inline: true });

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			i0.textContent = "menu";
    			t1 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			i1.textContent = "child_care";
    			t3 = space();
    			li1 = element("li");
    			a2 = element("a");
    			i2 = element("i");
    			i2.textContent = "local_dining";
    			t5 = space();
    			li2 = element("li");
    			a3 = element("a");
    			i3 = element("i");
    			i3.textContent = "book";
    			t7 = space();
    			li3 = element("li");
    			a4 = element("a");
    			i4 = element("i");
    			i4.textContent = "local_library";
    			t9 = space();
    			ul1 = element("ul");
    			li4 = element("li");
    			button = element("button");
    			button.textContent = "About";
    			t11 = space();
    			li5 = element("li");
    			a5 = element("a");
    			i5 = element("i");
    			i5.textContent = "dialpad";
    			t13 = space();
    			create_component(modal.$$.fragment);
    			attr_dev(i0, "class", "large material-icons");
    			add_location(i0, file$1, 28, 8, 858);
    			attr_dev(a0, "class", "btn-floating btn-large cyan pulse svelte-2yv810");
    			add_location(a0, file$1, 27, 6, 804);
    			attr_dev(i1, "class", "material-icons");
    			add_location(i1, file$1, 31, 119, 1053);
    			attr_dev(a1, "href", "#/cartoon");
    			attr_dev(a1, "class", "btn-floating tooltipped red svelte-2yv810");
    			attr_dev(a1, "data-position", "bottom");
    			attr_dev(a1, "data-tooltip", "Comics & Fun");
    			add_location(a1, file$1, 31, 12, 946);
    			add_location(li0, file$1, 31, 8, 942);
    			attr_dev(i2, "class", "material-icons");
    			add_location(i2, file$1, 32, 129, 1232);
    			attr_dev(a2, "href", "#/food");
    			attr_dev(a2, "class", "btn-floating tooltipped yellow darken-1 svelte-2yv810");
    			attr_dev(a2, "data-position", "bottom");
    			attr_dev(a2, "data-tooltip", "Food & Drinks");
    			add_location(a2, file$1, 32, 12, 1115);
    			add_location(li1, file$1, 32, 8, 1111);
    			attr_dev(i3, "class", "material-icons");
    			add_location(i3, file$1, 33, 122, 1406);
    			attr_dev(a3, "href", "#/dictionary");
    			attr_dev(a3, "class", "btn-floating tooltipped green svelte-2yv810");
    			attr_dev(a3, "data-position", "bottom");
    			attr_dev(a3, "data-tooltip", "Dictionary");
    			add_location(a3, file$1, 33, 12, 1296);
    			add_location(li2, file$1, 33, 8, 1292);
    			attr_dev(i4, "class", "material-icons");
    			add_location(i4, file$1, 34, 111, 1561);
    			attr_dev(a4, "href", "#/books");
    			attr_dev(a4, "class", "btn-floating tooltipped blue svelte-2yv810");
    			attr_dev(a4, "data-position", "bottom");
    			attr_dev(a4, "data-tooltip", "Books");
    			add_location(a4, file$1, 34, 12, 1462);
    			add_location(li3, file$1, 34, 8, 1458);
    			attr_dev(ul0, "class", "left");
    			add_location(ul0, file$1, 30, 6, 916);
    			attr_dev(div0, "id", "test");
    			attr_dev(div0, "class", "fixed-action-btn click-to-toggle svelte-2yv810");
    			add_location(div0, file$1, 26, 4, 741);
    			attr_dev(button, "data-target", "aboutmodal");
    			attr_dev(button, "class", "btn modal-trigger");
    			add_location(button, file$1, 40, 8, 1874);
    			set_style(li4, "padding-right", "0.5rem");
    			add_location(li4, file$1, 39, 6, 1832);
    			attr_dev(i5, "class", "medium material-icons");
    			add_location(i5, file$1, 43, 154, 2156);
    			attr_dev(a5, "class", "btn-floating tooltipped svelte-2yv810");
    			attr_dev(a5, "data-position", "bottom");
    			attr_dev(a5, "data-tooltip", "Github");
    			attr_dev(a5, "href", "//git.corp.adobe.com/rupachak/Kaleidoscope");
    			attr_dev(a5, "target", "_blank");
    			add_location(a5, file$1, 43, 8, 2010);
    			set_style(li5, "padding-right", "0.3rem");
    			add_location(li5, file$1, 42, 6, 1968);
    			attr_dev(ul1, "class", "right");
    			add_location(ul1, file$1, 38, 4, 1807);
    			attr_dev(div1, "class", "");
    			add_location(div1, file$1, 25, 2, 722);
    			attr_dev(nav, "class", "svelte-2yv810");
    			add_location(nav, file$1, 24, 0, 714);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(div0, t1);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i1);
    			append_dev(ul0, t3);
    			append_dev(ul0, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i2);
    			append_dev(ul0, t5);
    			append_dev(ul0, li2);
    			append_dev(li2, a3);
    			append_dev(a3, i3);
    			append_dev(ul0, t7);
    			append_dev(ul0, li3);
    			append_dev(li3, a4);
    			append_dev(a4, i4);
    			append_dev(div1, t9);
    			append_dev(div1, ul1);
    			append_dev(ul1, li4);
    			append_dev(li4, button);
    			append_dev(ul1, t11);
    			append_dev(ul1, li5);
    			append_dev(li5, a5);
    			append_dev(a5, i5);
    			insert_dev(target, t13, anchor);
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t13);
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);

    	document.addEventListener("DOMContentLoaded", function () {
    		var elems = document.querySelectorAll(".fixed-action-btn");
    		var instances = M.FloatingActionButton.init(elems, { direction: "right", hoverEnabled: false });
    		var tooltipElements = document.querySelectorAll(".tooltipped");
    		var tooltipInstances = M.Tooltip.init(tooltipElements, { position: "bottom" });
    		var belems = document.querySelectorAll(".modal");
    		var binstances = M.Modal.init(belems, { opacity: 0.5 });
    		var accelems = document.querySelectorAll(".collapsible");
    		var accinstances = M.Collapsible.init(accelems, { accordion: true });
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Modal });
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.29.7 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix) {
    				if (typeof prefix == "string" && path.startsWith(prefix)) {
    					path = path.substr(prefix.length) || "/";
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/UserInput.svelte generated by Svelte v3.29.7 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/components/UserInput.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (42:8) {#each dropdownOptions as dropdownJson}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*dropdownJson*/ ctx[10].displayText + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*dropdownJson*/ ctx[10].value;
    			option.value = option.__value;
    			add_location(option, file$2, 42, 10, 1180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dropdownOptions*/ 4 && t_value !== (t_value = /*dropdownJson*/ ctx[10].displayText + "")) set_data_dev(t, t_value);

    			if (dirty & /*dropdownOptions*/ 4 && option_value_value !== (option_value_value = /*dropdownJson*/ ctx[10].value)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(42:8) {#each dropdownOptions as dropdownJson}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let div4;
    	let div3;
    	let select;
    	let option;
    	let t1;
    	let t2;
    	let button;
    	let t3;
    	let i;
    	let mounted;
    	let dispose;
    	let each_value = /*dropdownOptions*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			select = element("select");
    			option = element("option");
    			t1 = text(/*dropdownPlaceholderDisplayText*/ ctx[4]);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			t3 = text("Search\n    ");
    			i = element("i");
    			i.textContent = "search";
    			attr_dev(input, "placeholder", /*placeholderSearchDisplayText*/ ctx[3]);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "validate");
    			add_location(input, file$2, 33, 10, 750);
    			add_location(div0, file$2, 32, 8, 734);
    			attr_dev(div1, "class", "input-field col s6 offset-s3");
    			add_location(div1, file$2, 31, 6, 683);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$2, 30, 2, 659);
    			option.__value = "";
    			option.value = option.__value;
    			option.disabled = true;
    			option.selected = true;
    			add_location(option, file$2, 40, 8, 1045);
    			attr_dev(select, "class", "browser-default");
    			if (/*selected*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			add_location(select, file$2, 39, 6, 982);
    			attr_dev(div3, "class", "col s4 offset-s4");
    			add_location(div3, file$2, 38, 4, 945);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$2, 37, 2, 923);
    			attr_dev(i, "class", "material-icons right");
    			add_location(i, file$2, 49, 4, 1402);
    			attr_dev(button, "class", "btn waves-effect waves-light");
    			add_location(button, file$2, 48, 2, 1306);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*searchterm*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, select);
    			append_dev(select, option);
    			append_dev(option, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selected*/ ctx[1]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t3);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keypress", /*keyPressHandler*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[8]),
    					listen_dev(button, "click", prevent_default(/*updateOptions*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholderSearchDisplayText*/ 8) {
    				attr_dev(input, "placeholder", /*placeholderSearchDisplayText*/ ctx[3]);
    			}

    			if (dirty & /*searchterm*/ 1 && input.value !== /*searchterm*/ ctx[0]) {
    				set_input_value(input, /*searchterm*/ ctx[0]);
    			}

    			if (dirty & /*dropdownPlaceholderDisplayText*/ 16) set_data_dev(t1, /*dropdownPlaceholderDisplayText*/ ctx[4]);

    			if (dirty & /*dropdownOptions*/ 4) {
    				each_value = /*dropdownOptions*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selected, dropdownOptions*/ 6) {
    				select_option(select, /*selected*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserInput", slots, []);
    	let { searchterm } = $$props;
    	let { selected } = $$props;
    	let { dropdownOptions = [] } = $$props;
    	let { placeholderSearchDisplayText = "Enter a search term" } = $$props;
    	let { dropdownPlaceholderDisplayText = "Please Select a Data Source" } = $$props;
    	const dispatch = createEventDispatcher();

    	function updateOptions(event) {
    		dispatch("updateParent", {
    			searchQuery: searchterm,
    			selection: selected
    		});

    		console.log(searchterm, selected);
    	}

    	function keyPressHandler(event) {
    		if (event !== "undefined") {
    			if (event.keyCode == 13) {
    				console.log("Enter Pressed");
    				updateOptions();
    			}
    		}
    	}

    	const writable_props = [
    		"searchterm",
    		"selected",
    		"dropdownOptions",
    		"placeholderSearchDisplayText",
    		"dropdownPlaceholderDisplayText"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<UserInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchterm = this.value;
    		$$invalidate(0, searchterm);
    	}

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(1, selected);
    		$$invalidate(2, dropdownOptions);
    	}

    	$$self.$$set = $$props => {
    		if ("searchterm" in $$props) $$invalidate(0, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("dropdownOptions" in $$props) $$invalidate(2, dropdownOptions = $$props.dropdownOptions);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(3, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(4, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    	};

    	$$self.$capture_state = () => ({
    		searchterm,
    		selected,
    		dropdownOptions,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		createEventDispatcher,
    		dispatch,
    		updateOptions,
    		keyPressHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("searchterm" in $$props) $$invalidate(0, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("dropdownOptions" in $$props) $$invalidate(2, dropdownOptions = $$props.dropdownOptions);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(3, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(4, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		searchterm,
    		selected,
    		dropdownOptions,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		updateOptions,
    		keyPressHandler,
    		input_input_handler,
    		select_change_handler
    	];
    }

    class UserInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			searchterm: 0,
    			selected: 1,
    			dropdownOptions: 2,
    			placeholderSearchDisplayText: 3,
    			dropdownPlaceholderDisplayText: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserInput",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchterm*/ ctx[0] === undefined && !("searchterm" in props)) {
    			console_1$1.warn("<UserInput> was created without expected prop 'searchterm'");
    		}

    		if (/*selected*/ ctx[1] === undefined && !("selected" in props)) {
    			console_1$1.warn("<UserInput> was created without expected prop 'selected'");
    		}
    	}

    	get searchterm() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchterm(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropdownOptions() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropdownOptions(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholderSearchDisplayText() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholderSearchDisplayText(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropdownPlaceholderDisplayText() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropdownPlaceholderDisplayText(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    var getResponseFromURL = async function(url,queryParamsJson={}, headersJson={}) {
      let response = await axios$1.get(url,{params: queryParamsJson,headers:headersJson});
      return response.data;
    };

    var request = {
      getResponseFromURL: getResponseFromURL
    };

    var keys = {
      OXFORD_DICTIONARY_APP_ID : 'ada7d056',
      OXFORD_DICTIONARY_APP_KEY : 'ff83778c60bfe173efb892e9f95c8789',
      OWLBOT_API_TOKEN: '794df8601f4768c50e4691b18f1c3a4b9c44457e',
      GOODREADS_API_KEY: "zqDRDTXgOi7JICyvMN7g"
    };

    var constants = {
      PUNK_API_URI: "https://api.punkapi.com/v2/beers/random",
      TACO_API_URI: "http://taco-randomizer.herokuapp.com/random/",
      RECIPE_PUPPY_URI: "https://cors-anywhere.herokuapp.com/http://www.recipepuppy.com/api/",
      FOODISH_API_URI: "https://foodish-api.herokuapp.com/api/",
      OWLBOT_API_URI: "https://owlbot.info/api/v4/dictionary/",
      OXFORD_API_URI: "https://cors-anywhere.herokuapp.com/https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/",
      POKEMON_API_URI: "https://pokeapi.co/api/v2/pokemon/",
      RICK_AND_MORTY_API_URI: "https://rickandmortyapi.com/api/character/",
      GOODREADS_API_URI: "https://cors-anywhere.herokuapp.com/https://www.goodreads.com/search.xml"
    };

    var getParsedPunkAPIResponse = function(punkAPIResponse) {
      let parsedResponseJson;
        parsedResponseJson = {
          Name: punkAPIResponse.name,
          Tagline: punkAPIResponse.tagline,
          Description: punkAPIResponse.description,
          FoodPairing: punkAPIResponse.food_pairing.join('|'),
          BrewersTips: punkAPIResponse.brewers_tips
        };
      return parsedResponseJson;
    };

    var getParsedTacoAPIResponse = function(tacoAPIResponse) {
      let parsedResponseJson = {
        "Mixin": tacoAPIResponse["mixin"]["recipe"],
        "Seasoning": tacoAPIResponse["seasoning"]["recipe"],
        "Base Layer": tacoAPIResponse["base_layer"]["recipe"],
        "Condiment": tacoAPIResponse["condiment"]["recipe"],
        "Shell": tacoAPIResponse["shell"]["recipe"]
      };
      return parsedResponseJson;
    };

    var getParsedRecipePuppyAPIResponse = function(puppyAPIResponse) {
      let parsedResponseJsonList = puppyAPIResponse["results"];
      return parsedResponseJsonList;
    };

    var getParsedOwlbotAPIResponse = function(owlbotResponseJson) {
      let definitionList = owlbotResponseJson["definitions"];
      return definitionList;
    };

    var getParsedOxfordDictionaryAPIResponse = function(oxfordResponseJson) {
      let resultJson = oxfordResponseJson["results"][0];
      let lexicalEntries = resultJson["lexicalEntries"];
      let lexicalCategoryList = [];
      let masterDefinitionList = [];
      let parsedJsonResponseList = [];
      for(let i = 0; i < lexicalEntries.length; i++) {
        lexicalCategoryList.push(lexicalEntries[i].lexicalCategory.text);
        let entries = lexicalEntries[i].entries;
        for(let j = 0; j < entries.length; j++) {
          let senses = entries[j].senses;
          let definitionList = [];
          for(let k = 0; k < senses.length; k++) {
            definitionList.push(senses[k].definitions[0]);
          }
          masterDefinitionList.push(definitionList);
        }
      }
      for(let i = 0; i < lexicalCategoryList.length; i++) {
        for(let j = 0; j < masterDefinitionList[i].length; j++) {
          parsedJsonResponseList.push({"Type":lexicalCategoryList[i],
                                      "Definition":masterDefinitionList[i][j]});
        }
      }
      return parsedJsonResponseList;
    };

    var getParsedPokemonAPIResponse = function(pokemonResponseJson) {
      let abilityReducer = (previousString,newString) => previousString.ability.name + "|" + newString.ability.name;
      let abilitiesString = pokemonResponseJson.abilities.reduce(abilityReducer);
      let typesReducer = (previousJson,currentJson) => previousJson.type.name + "|" + currentJson.type.name;
      let typesString = pokemonResponseJson.types.reduce(typesReducer);
      if (typeof(abilitiesString) === 'object') {
        abilitiesString = abilitiesString.ability.name;
      }
      if (typeof(typesString) === 'object') {
        typesString = typesString.type.name;
      }
      let parsedResponse = {
        "Abilities": abilitiesString,
        "Types": typesString,
        "Height": pokemonResponseJson.height,
        "Weight": pokemonResponseJson.weight
      };
      return parsedResponse;
    };

    var getParsedRickAndMortyAPIResponse = function(rickAndMortyResponseJson) {
      let resultListJson = rickAndMortyResponseJson["results"];
      let parsedJsonResponseList = [];
      for(let i = 0; i < resultListJson.length; i++) {
        parsedJsonResponseList[i] = {
          "Name": resultListJson[i].name,
          "Status": resultListJson[i].status,
          "Species": resultListJson[i].species,
          "Gender": resultListJson[i].gender,
          "Origin": resultListJson[i].origin.name,
          "Location": resultListJson[i].location.name
        };
      }
      return parsedJsonResponseList;
    };

    var getParsedGoodReadsAPIResponse = function(goodReadsResponse) {
      let resultListJson = goodReadsResponse.GoodreadsResponse.search.results.work;
      let parsedJsonResponseList = [];
      for(let i = 0; i < resultListJson.length; i++) {
        parsedJsonResponseList[i] = {
            "ratings_count": resultListJson[i]["ratings_count"],
            "text_reviews_count": resultListJson[i]["text_reviews_count"],
            "average_rating": resultListJson[i]["average_rating"],
            "title": resultListJson[i]["best_book"]["title"],
            "author": resultListJson[i]["best_book"]["author"]["name"],
            "image_url": resultListJson[i]["best_book"]["image_url"]
        };
      }
      return parsedJsonResponseList;
    };

    var parser = {
      getParsedPunkAPIResponse: getParsedPunkAPIResponse,
      getParsedTacoAPIResponse: getParsedTacoAPIResponse,
      getParsedRecipePuppyAPIResponse: getParsedRecipePuppyAPIResponse,
      getParsedOwlbotAPIResponse: getParsedOwlbotAPIResponse,
      getParsedOxfordDictionaryAPIResponse: getParsedOxfordDictionaryAPIResponse,
      getParsedPokemonAPIResponse: getParsedPokemonAPIResponse,
      getParsedRickAndMortyAPIResponse: getParsedRickAndMortyAPIResponse,
      getParsedGoodReadsAPIResponse: getParsedGoodReadsAPIResponse
    };

    var getFormattedJsonForAccordion = function(jsonResponse) {
      let jsonKeys = Object.keys(jsonResponse);
      let formattedJsonList = [];
      for(let i = 0; i < jsonKeys.length; i++) {
        formattedJsonList[i] = {
          header: jsonKeys[i],
          content: jsonResponse[jsonKeys[i]]
        };
      }
      return formattedJsonList;
    };

    var formatJsonResponseForTableUI = function(parsedResponseJsonList) {
      let headerList = [];
      let tableContentList = [];
      var formattedTableJson = {
        'headerList': headerList,
        'tableContentList': tableContentList
      };
      if(parsedResponseJsonList.length > 0) {
          headerList = Object.keys(parsedResponseJsonList[0]);
          for(var i = 0; i < parsedResponseJsonList.length; i++) {
            tableContentList.push(Object.values(parsedResponseJsonList[i]));
          }
          formattedTableJson["headerList"] = headerList;
          formattedTableJson["tableContentList"] = tableContentList;
       }

      return formattedTableJson;

    };

    var formatFoodishAPIResponseForUI = function(parsedResponse) {
      let imageHTML = "<img src=" + "'" + parsedResponse + "'" + " width='500px'  height='500px'" +">";
      return [{header: "Foodish Image", content: imageHTML}];
    };


    var formatutils = {
      getFormattedJsonForAccordion: getFormattedJsonForAccordion,
      formatJsonResponseForTableUI: formatJsonResponseForTableUI,
      formatFoodishAPIResponseForUI: formatFoodishAPIResponseForUI
    };

    var getPokemonResponsePipeline = async function(searchTerm) {
      let defaultPokemonSearchTerm = 'pikachu';
      if (searchTerm == '') {
        searchTerm = defaultPokemonSearchTerm;
      }
      let uri = constants.POKEMON_API_URI + searchTerm;
      let response = await request.getResponseFromURL(uri);
      let parsedResponse = parser.getParsedPokemonAPIResponse(response);
      let formattedResponse = formatutils.formatJsonResponseForTableUI([parsedResponse]);
      return formattedResponse;
    };

    var getRickAndMortyResponsePipeline = async function(searchTerm) {
      let defaultRickAndMortySearchTerm = 'morty';
      if (searchTerm == '') {
        searchTerm = defaultRickAndMortySearchTerm;
      }
      let uri = constants.RICK_AND_MORTY_API_URI;
      let queryParamsJson = {"name":searchTerm};
      let response = await request.getResponseFromURL(uri,queryParamsJson);
      let parsedResponseJsonList = parser.getParsedRickAndMortyAPIResponse(response);
      let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedResponseJsonList);
      return formattedTableJson;
    };
    var cartoonPipeline = {
      getPokemonResponsePipeline: getPokemonResponsePipeline,
      getRickAndMortyResponsePipeline: getRickAndMortyResponsePipeline
    };

    /* src/components/Table.svelte generated by Svelte v3.29.7 */

    const file$3 = "src/components/Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (14:6) {#each tableHeaderList as tableHeader}
    function create_each_block_2(ctx) {
    	let th;
    	let t_value = /*tableHeader*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$3, 14, 8, 260);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tableHeaderList*/ 1 && t_value !== (t_value = /*tableHeader*/ ctx[9] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(14:6) {#each tableHeaderList as tableHeader}",
    		ctx
    	});

    	return block;
    }

    // (22:10) {#each tableRowList as tableRowData}
    function create_each_block_1(ctx) {
    	let td;
    	let t_value = /*tableRowData*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$3, 22, 12, 444);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tableContentList*/ 2 && t_value !== (t_value = /*tableRowData*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(22:10) {#each tableRowList as tableRowData}",
    		ctx
    	});

    	return block;
    }

    // (20:4) {#each tableContentList as tableRowList }
    function create_each_block$1(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*tableRowList*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$3, 20, 6, 380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tableContentList*/ 2) {
    				each_value_1 = /*tableRowList*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(20:4) {#each tableContentList as tableRowList }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let t;
    	let tbody;
    	let each_value_2 = /*tableHeaderList*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*tableContentList*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$3, 12, 4, 202);
    			add_location(thead, file$3, 11, 2, 190);
    			add_location(tbody, file$3, 18, 2, 320);
    			attr_dev(table, "class", "striped");
    			add_location(table, file$3, 10, 0, 164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tableHeaderList*/ 1) {
    				each_value_2 = /*tableHeaderList*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*tableContentList*/ 2) {
    				each_value = /*tableContentList*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, []);

    	let { tableJson = {
    		headerList: [],
    		tableContentList: [[], [], []]
    	} } = $$props;

    	let { tableHeaderList = [] } = $$props;
    	let { tableContentList = [] } = $$props;
    	const writable_props = ["tableJson", "tableHeaderList", "tableContentList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tableJson" in $$props) $$invalidate(2, tableJson = $$props.tableJson);
    		if ("tableHeaderList" in $$props) $$invalidate(0, tableHeaderList = $$props.tableHeaderList);
    		if ("tableContentList" in $$props) $$invalidate(1, tableContentList = $$props.tableContentList);
    	};

    	$$self.$capture_state = () => ({
    		tableJson,
    		tableHeaderList,
    		tableContentList
    	});

    	$$self.$inject_state = $$props => {
    		if ("tableJson" in $$props) $$invalidate(2, tableJson = $$props.tableJson);
    		if ("tableHeaderList" in $$props) $$invalidate(0, tableHeaderList = $$props.tableHeaderList);
    		if ("tableContentList" in $$props) $$invalidate(1, tableContentList = $$props.tableContentList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tableHeaderList, tableContentList, tableJson];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			tableJson: 2,
    			tableHeaderList: 0,
    			tableContentList: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get tableJson() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableJson(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tableHeaderList() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableHeaderList(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tableContentList() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableContentList(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Spinner.svelte generated by Svelte v3.29.7 */

    const file$4 = "src/components/Spinner.svelte";

    function create_fragment$5(ctx) {
    	let div28;
    	let div6;
    	let div1;
    	let div0;
    	let t0;
    	let div3;
    	let div2;
    	let t1;
    	let div5;
    	let div4;
    	let t2;
    	let div13;
    	let div8;
    	let div7;
    	let t3;
    	let div10;
    	let div9;
    	let t4;
    	let div12;
    	let div11;
    	let t5;
    	let div20;
    	let div15;
    	let div14;
    	let t6;
    	let div17;
    	let div16;
    	let t7;
    	let div19;
    	let div18;
    	let t8;
    	let div27;
    	let div22;
    	let div21;
    	let t9;
    	let div24;
    	let div23;
    	let t10;
    	let div26;
    	let div25;

    	const block = {
    		c: function create() {
    			div28 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t2 = space();
    			div13 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			t3 = space();
    			div10 = element("div");
    			div9 = element("div");
    			t4 = space();
    			div12 = element("div");
    			div11 = element("div");
    			t5 = space();
    			div20 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			t6 = space();
    			div17 = element("div");
    			div16 = element("div");
    			t7 = space();
    			div19 = element("div");
    			div18 = element("div");
    			t8 = space();
    			div27 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			t9 = space();
    			div24 = element("div");
    			div23 = element("div");
    			t10 = space();
    			div26 = element("div");
    			div25 = element("div");
    			attr_dev(div0, "class", "circle");
    			add_location(div0, file$4, 3, 9, 162);
    			attr_dev(div1, "class", "circle-clipper left");
    			add_location(div1, file$4, 2, 7, 119);
    			attr_dev(div2, "class", "circle");
    			add_location(div2, file$4, 5, 9, 235);
    			attr_dev(div3, "class", "gap-patch");
    			add_location(div3, file$4, 4, 13, 202);
    			attr_dev(div4, "class", "circle");
    			add_location(div4, file$4, 7, 9, 319);
    			attr_dev(div5, "class", "circle-clipper right");
    			add_location(div5, file$4, 6, 13, 275);
    			attr_dev(div6, "class", "spinner-layer spinner-blue");
    			add_location(div6, file$4, 1, 5, 71);
    			attr_dev(div7, "class", "circle");
    			add_location(div7, file$4, 13, 9, 468);
    			attr_dev(div8, "class", "circle-clipper left");
    			add_location(div8, file$4, 12, 7, 425);
    			attr_dev(div9, "class", "circle");
    			add_location(div9, file$4, 15, 9, 541);
    			attr_dev(div10, "class", "gap-patch");
    			add_location(div10, file$4, 14, 13, 508);
    			attr_dev(div11, "class", "circle");
    			add_location(div11, file$4, 17, 9, 625);
    			attr_dev(div12, "class", "circle-clipper right");
    			add_location(div12, file$4, 16, 13, 581);
    			attr_dev(div13, "class", "spinner-layer spinner-red");
    			add_location(div13, file$4, 11, 5, 378);
    			attr_dev(div14, "class", "circle");
    			add_location(div14, file$4, 23, 9, 777);
    			attr_dev(div15, "class", "circle-clipper left");
    			add_location(div15, file$4, 22, 7, 734);
    			attr_dev(div16, "class", "circle");
    			add_location(div16, file$4, 25, 9, 850);
    			attr_dev(div17, "class", "gap-patch");
    			add_location(div17, file$4, 24, 13, 817);
    			attr_dev(div18, "class", "circle");
    			add_location(div18, file$4, 27, 9, 934);
    			attr_dev(div19, "class", "circle-clipper right");
    			add_location(div19, file$4, 26, 13, 890);
    			attr_dev(div20, "class", "spinner-layer spinner-yellow");
    			add_location(div20, file$4, 21, 5, 684);
    			attr_dev(div21, "class", "circle");
    			add_location(div21, file$4, 33, 9, 1085);
    			attr_dev(div22, "class", "circle-clipper left");
    			add_location(div22, file$4, 32, 7, 1042);
    			attr_dev(div23, "class", "circle");
    			add_location(div23, file$4, 35, 9, 1158);
    			attr_dev(div24, "class", "gap-patch");
    			add_location(div24, file$4, 34, 13, 1125);
    			attr_dev(div25, "class", "circle");
    			add_location(div25, file$4, 37, 9, 1242);
    			attr_dev(div26, "class", "circle-clipper right");
    			add_location(div26, file$4, 36, 13, 1198);
    			attr_dev(div27, "class", "spinner-layer spinner-green");
    			add_location(div27, file$4, 31, 5, 993);
    			attr_dev(div28, "class", "preloader-wrapper big active");
    			set_style(div28, "margin-top", "20%");
    			add_location(div28, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div28, anchor);
    			append_dev(div28, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div28, t2);
    			append_dev(div28, div13);
    			append_dev(div13, div8);
    			append_dev(div8, div7);
    			append_dev(div8, t3);
    			append_dev(div13, div10);
    			append_dev(div10, div9);
    			append_dev(div10, t4);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div28, t5);
    			append_dev(div28, div20);
    			append_dev(div20, div15);
    			append_dev(div15, div14);
    			append_dev(div15, t6);
    			append_dev(div20, div17);
    			append_dev(div17, div16);
    			append_dev(div17, t7);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div28, t8);
    			append_dev(div28, div27);
    			append_dev(div27, div22);
    			append_dev(div22, div21);
    			append_dev(div22, t9);
    			append_dev(div27, div24);
    			append_dev(div24, div23);
    			append_dev(div24, t10);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div28);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Spinner", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spinner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Cartoon.svelte generated by Svelte v3.29.7 */

    const { console: console_1$2 } = globals;
    const file$5 = "src/Cartoon.svelte";

    // (51:0) {#if showResultLoader}
    function create_if_block$1(ctx) {
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(51:0) {#if showResultLoader}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let userinput;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div;
    	let t3;
    	let table;
    	let current;

    	userinput = new UserInput({
    			props: {
    				searchterm: /*searchterm*/ ctx[1],
    				selected: /*selected*/ ctx[2],
    				dropdownOptions: /*dropdownOptions*/ ctx[6],
    				placeholderSearchDisplayText: /*placeholderSearchDisplayText*/ ctx[4],
    				dropdownPlaceholderDisplayText: /*dropdownPlaceholderDisplayText*/ ctx[5]
    			},
    			$$inline: true
    		});

    	userinput.$on("updateParent", /*handleParentUpdate*/ ctx[7]);
    	let if_block = /*showResultLoader*/ ctx[3] && create_if_block$1(ctx);

    	table = new Table({
    			props: {
    				tableHeaderList: /*tableJson*/ ctx[0].headerList,
    				tableContentList: /*tableJson*/ ctx[0].tableContentList
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(table.$$.fragment);
    			add_location(br0, file$5, 47, 0, 1405);
    			add_location(br1, file$5, 48, 0, 1411);
    			attr_dev(div, "class", "container");
    			add_location(div, file$5, 49, 0, 1417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t3);
    			mount_component(table, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const userinput_changes = {};
    			if (dirty & /*searchterm*/ 2) userinput_changes.searchterm = /*searchterm*/ ctx[1];
    			if (dirty & /*selected*/ 4) userinput_changes.selected = /*selected*/ ctx[2];
    			userinput.$set(userinput_changes);

    			if (/*showResultLoader*/ ctx[3]) {
    				if (if_block) {
    					if (dirty & /*showResultLoader*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t3);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const table_changes = {};
    			if (dirty & /*tableJson*/ 1) table_changes.tableHeaderList = /*tableJson*/ ctx[0].headerList;
    			if (dirty & /*tableJson*/ 1) table_changes.tableContentList = /*tableJson*/ ctx[0].tableContentList;
    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(table);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cartoon", slots, []);

    	let tableJson = {
    		headerList: [],
    		tableContentList: [[], []]
    	};

    	let searchterm = "";
    	let selected;
    	let showResultLoader = false;
    	let placeholderSearchDisplayText = "Enter a cartoon search term";
    	let dropdownPlaceholderDisplayText = "Please Select a Cartoon Data Source";

    	let dropdownOptions = [
    		{
    			value: "pokemon",
    			displayText: "Pokemon API"
    		},
    		{
    			value: "ricky",
    			displayText: "Rick & Morty API"
    		}
    	];

    	async function handleParentUpdate(updateParentEvent) {
    		console.log(updateParentEvent);
    		const detail = updateParentEvent.detail;
    		$$invalidate(1, searchterm = detail.searchQuery);
    		$$invalidate(2, selected = detail.selection);
    		$$invalidate(3, showResultLoader = true);

    		if (selected == "pokemon") {
    			$$invalidate(0, tableJson = await cartoonPipeline.getPokemonResponsePipeline(searchterm));
    		} else {
    			$$invalidate(0, tableJson = await cartoonPipeline.getRickAndMortyResponsePipeline(searchterm));
    		}

    		console.log(tableJson);
    		$$invalidate(3, showResultLoader = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Cartoon> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		UserInput,
    		cartoonPipeline,
    		Table,
    		Spinner,
    		tableJson,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("tableJson" in $$props) $$invalidate(0, tableJson = $$props.tableJson);
    		if ("searchterm" in $$props) $$invalidate(1, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(2, selected = $$props.selected);
    		if ("showResultLoader" in $$props) $$invalidate(3, showResultLoader = $$props.showResultLoader);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(4, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(5, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    		if ("dropdownOptions" in $$props) $$invalidate(6, dropdownOptions = $$props.dropdownOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tableJson,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	];
    }

    class Cartoon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cartoon",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Accordion.svelte generated by Svelte v3.29.7 */

    const file$6 = "src/components/Accordion.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:2) {#each accordionResultJsonList as accordionJson }
    function create_each_block$2(ctx) {
    	let li;
    	let div0;
    	let i;
    	let t1_value = /*accordionJson*/ ctx[1].header + "";
    	let t1;
    	let t2;
    	let div1;
    	let span;
    	let raw_value = /*accordionJson*/ ctx[1].content + "";
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			i = element("i");
    			i.textContent = "whatshot";
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			span = element("span");
    			t3 = space();
    			attr_dev(i, "class", "material-icons");
    			add_location(i, file$6, 13, 38, 358);
    			attr_dev(div0, "class", "collapsible-header");
    			add_location(div0, file$6, 13, 6, 326);
    			add_location(span, file$6, 14, 36, 461);
    			attr_dev(div1, "class", "collapsible-body");
    			add_location(div1, file$6, 14, 6, 431);
    			add_location(li, file$6, 12, 4, 315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, i);
    			append_dev(div0, t1);
    			append_dev(li, t2);
    			append_dev(li, div1);
    			append_dev(div1, span);
    			span.innerHTML = raw_value;
    			append_dev(li, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*accordionResultJsonList*/ 1 && t1_value !== (t1_value = /*accordionJson*/ ctx[1].header + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*accordionResultJsonList*/ 1 && raw_value !== (raw_value = /*accordionJson*/ ctx[1].content + "")) span.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(12:2) {#each accordionResultJsonList as accordionJson }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let ul;
    	let each_value = /*accordionResultJsonList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "collapsible popout");
    			add_location(ul, file$6, 10, 0, 227);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*accordionResultJsonList*/ 1) {
    				each_value = /*accordionResultJsonList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Accordion", slots, []);
    	let { accordionResultJsonList = [] } = $$props;

    	document.addEventListener("click", function () {
    		var elems = document.querySelectorAll(".collapsible");
    		var instances = M.Collapsible.init(elems, {});
    	});

    	const writable_props = ["accordionResultJsonList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Accordion> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("accordionResultJsonList" in $$props) $$invalidate(0, accordionResultJsonList = $$props.accordionResultJsonList);
    	};

    	$$self.$capture_state = () => ({ accordionResultJsonList });

    	$$self.$inject_state = $$props => {
    		if ("accordionResultJsonList" in $$props) $$invalidate(0, accordionResultJsonList = $$props.accordionResultJsonList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [accordionResultJsonList];
    }

    class Accordion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { accordionResultJsonList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Accordion",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get accordionResultJsonList() {
    		throw new Error("<Accordion>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accordionResultJsonList(value) {
    		throw new Error("<Accordion>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var getPunkAPIParsedResultPipeline = async function(uri=constants.PUNK_API_URI) {
      let response = await request.getResponseFromURL(uri);
      let result = response[0];
      let parsedResult = parser.getParsedPunkAPIResponse(result);
      let accordionResultJsonList = formatutils.getFormattedJsonForAccordion(parsedResult);
      return accordionResultJsonList;
    };

    var getTacoAPIParsedResultPipeline = async function(uri=constants.TACO_API_URI) {
      let response = await request.getResponseFromURL(uri);
      let parsedTacoResponse = parser.getParsedTacoAPIResponse(response);
      let accordionResultJsonList = formatutils.getFormattedJsonForAccordion(parsedTacoResponse);
      return accordionResultJsonList;
    };

    var getRecipePuppyAPIParsedResultPipeline = async function(searchQuery, uri=constants.RECIPE_PUPPY_URI) {
      let response = await request.getResponseFromURL(uri,{q:searchQuery});
      let parsedJsonResponseList = parser.getParsedRecipePuppyAPIResponse(response);
      let tableJson = formatutils.formatJsonResponseForTableUI(parsedJsonResponseList);
      return tableJson;
    };

    var getFoodishAPIParsedResultPipeline = async function(searchQuery, uri=constants.FOODISH_API_URI) {
      let response = await request.getResponseFromURL(uri);
      let parsedJson = response["image"];
      let foodishResponse = formatutils.formatFoodishAPIResponseForUI(parsedJson);
      return foodishResponse;
    };

    var foodRequestPipelineHandler = async function(foodAPIKey,searchTerm='') {
      let accordionResultJsonList=[];
      if(foodAPIKey.toLowerCase() == 'taco') {
        accordionResultJsonList = await getTacoAPIParsedResultPipeline();
      } else if(foodAPIKey.toLowerCase() == 'puppy') {
        accordionResultJsonList = await getRecipePuppyAPIParsedResultPipeline(searchTerm);
      } else if (foodAPIKey.toLowerCase() == 'foodish') {
        accordionResultJsonList = await getFoodishAPIParsedResultPipeline();
      } else {
        accordionResultJsonList = await getPunkAPIParsedResultPipeline();
      }
      return accordionResultJsonList;
    };

    var pipeline = {
      getPunkAPIParsedResultPipeline: getPunkAPIParsedResultPipeline,
      getTacoAPIParsedResultPipeline: getTacoAPIParsedResultPipeline,
      getRecipePuppyAPIParsedResultPipeline: getRecipePuppyAPIParsedResultPipeline,
      getFoodishAPIParsedResultPipeline: getFoodishAPIParsedResultPipeline,
      foodRequestPipelineHandler: foodRequestPipelineHandler
    };

    /* src/Food.svelte generated by Svelte v3.29.7 */

    const { console: console_1$3 } = globals;
    const file$7 = "src/Food.svelte";

    // (64:0) {#if showResultLoader}
    function create_if_block_1(ctx) {
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(64:0) {#if showResultLoader}",
    		ctx
    	});

    	return block;
    }

    // (69:2) {:else}
    function create_else_block$1(ctx) {
    	let accordion;
    	let current;

    	accordion = new Accordion({
    			props: {
    				accordionResultJsonList: /*accordionResultJsonList*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(accordion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accordion, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const accordion_changes = {};
    			if (dirty & /*accordionResultJsonList*/ 2) accordion_changes.accordionResultJsonList = /*accordionResultJsonList*/ ctx[1];
    			accordion.$set(accordion_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(accordion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(69:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (67:2) {#if selected == 'puppy'}
    function create_if_block$2(ctx) {
    	let table;
    	let current;

    	table = new Table({
    			props: {
    				tableHeaderList: /*tableJson*/ ctx[0].headerList,
    				tableContentList: /*tableJson*/ ctx[0].tableContentList
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};
    			if (dirty & /*tableJson*/ 1) table_changes.tableHeaderList = /*tableJson*/ ctx[0].headerList;
    			if (dirty & /*tableJson*/ 1) table_changes.tableContentList = /*tableJson*/ ctx[0].tableContentList;
    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(67:2) {#if selected == 'puppy'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let userinput;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div;
    	let t3;
    	let current_block_type_index;
    	let if_block1;
    	let current;

    	userinput = new UserInput({
    			props: {
    				searchterm: /*searchterm*/ ctx[2],
    				selected: /*selected*/ ctx[3],
    				dropdownOptions: /*dropdownOptions*/ ctx[7],
    				placeholderSearchDisplayText: /*placeholderSearchDisplayText*/ ctx[5],
    				dropdownPlaceholderDisplayText: /*dropdownPlaceholderDisplayText*/ ctx[6]
    			},
    			$$inline: true
    		});

    	userinput.$on("updateParent", /*handleParentUpdate*/ ctx[8]);
    	let if_block0 = /*showResultLoader*/ ctx[4] && create_if_block_1(ctx);
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*selected*/ ctx[3] == "puppy") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if_block1.c();
    			add_location(br0, file$7, 60, 0, 1611);
    			add_location(br1, file$7, 61, 0, 1617);
    			attr_dev(div, "class", "container");
    			add_location(div, file$7, 62, 0, 1623);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t3);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const userinput_changes = {};
    			if (dirty & /*searchterm*/ 4) userinput_changes.searchterm = /*searchterm*/ ctx[2];
    			if (dirty & /*selected*/ 8) userinput_changes.selected = /*selected*/ ctx[3];
    			userinput.$set(userinput_changes);

    			if (/*showResultLoader*/ ctx[4]) {
    				if (if_block0) {
    					if (dirty & /*showResultLoader*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t3);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Food", slots, []);

    	let tableJson = {
    		headerList: [],
    		tableContentList: [[], []]
    	};

    	let result = "";
    	let accordionResultJsonList = [];
    	let searchterm = "";
    	let selected = "";
    	let showResultLoader = false;
    	let placeholderSearchDisplayText = "Enter a food search term";
    	let dropdownPlaceholderDisplayText = "Please Select a Food Data Source";

    	let dropdownOptions = [
    		{
    			value: "taco",
    			displayText: "Taco Randomizer API"
    		},
    		{ value: "punk", displayText: "Punk API" },
    		{
    			value: "puppy",
    			displayText: "Recipe Puppy API"
    		},
    		{
    			value: "foodish",
    			displayText: "Foodish API"
    		}
    	];

    	async function handleParentUpdate(updateParentEvent) {
    		console.log(updateParentEvent);
    		const detail = updateParentEvent.detail;
    		$$invalidate(2, searchterm = detail.searchQuery);
    		$$invalidate(3, selected = detail.selection);
    		$$invalidate(4, showResultLoader = true);

    		if (selected == "puppy") {
    			$$invalidate(0, tableJson = await pipeline.foodRequestPipelineHandler(selected, searchterm));
    		} else {
    			$$invalidate(1, accordionResultJsonList = await pipeline.foodRequestPipelineHandler(selected, searchterm));
    		}

    		$$invalidate(4, showResultLoader = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Food> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		UserInput,
    		Accordion,
    		Table,
    		pipeline,
    		Spinner,
    		tableJson,
    		result,
    		accordionResultJsonList,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("tableJson" in $$props) $$invalidate(0, tableJson = $$props.tableJson);
    		if ("result" in $$props) result = $$props.result;
    		if ("accordionResultJsonList" in $$props) $$invalidate(1, accordionResultJsonList = $$props.accordionResultJsonList);
    		if ("searchterm" in $$props) $$invalidate(2, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(3, selected = $$props.selected);
    		if ("showResultLoader" in $$props) $$invalidate(4, showResultLoader = $$props.showResultLoader);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(5, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(6, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    		if ("dropdownOptions" in $$props) $$invalidate(7, dropdownOptions = $$props.dropdownOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tableJson,
    		accordionResultJsonList,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	];
    }

    class Food extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Food",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    var owlbotAPIResponsePipeline = async function(searchTerm) {
        if (searchTerm == '') {
          searchTerm = 'bank';
        }
        let headerJson = {'Authorization': 'Token '+ keys.OWLBOT_API_TOKEN};
        let uri = constants.OWLBOT_API_URI + searchTerm;
        let response = await request.getResponseFromURL(uri,{},headerJson);
        let parsedDefinitionList = parser.getParsedOwlbotAPIResponse(response);
        let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedDefinitionList);
        return formattedTableJson;
      };

    var oxfordDictionaryResponsePipeline = async function(searchTerm) {
      if (searchTerm == '') {
        searchTerm = 'bank';
      }
      let headerJson = {
        "Accept": "application/json",
        "app_id": keys.OXFORD_DICTIONARY_APP_ID,
        "app_key": keys.OXFORD_DICTIONARY_APP_KEY
      };
      let queryParamsJson = {"fields":"definitions","strictMatch":false};
      let uri = constants.OXFORD_API_URI + searchTerm;
      let response = await request.getResponseFromURL(uri, queryParamsJson, headerJson);
      let parsedResponseJsonList = parser.getParsedOxfordDictionaryAPIResponse(response);
      let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedResponseJsonList);
      return formattedTableJson;
    };
    var dictionarypipeline = {
      owlbotAPIResponsePipeline: owlbotAPIResponsePipeline,
      oxfordDictionaryResponsePipeline: oxfordDictionaryResponsePipeline
    };

    /* src/Dictionary.svelte generated by Svelte v3.29.7 */

    const { console: console_1$4 } = globals;
    const file$8 = "src/Dictionary.svelte";

    // (49:0) {#if showResultLoader}
    function create_if_block$3(ctx) {
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(49:0) {#if showResultLoader}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let userinput;
    	let t0;
    	let div;
    	let t1;
    	let table;
    	let current;

    	userinput = new UserInput({
    			props: {
    				searchterm: /*searchterm*/ ctx[1],
    				selected: /*selected*/ ctx[2],
    				dropdownOptions: /*dropdownOptions*/ ctx[6],
    				placeholderSearchDisplayText: /*placeholderSearchDisplayText*/ ctx[4],
    				dropdownPlaceholderDisplayText: /*dropdownPlaceholderDisplayText*/ ctx[5]
    			},
    			$$inline: true
    		});

    	userinput.$on("updateParent", /*handleParentUpdate*/ ctx[7]);
    	let if_block = /*showResultLoader*/ ctx[3] && create_if_block$3(ctx);

    	table = new Table({
    			props: {
    				tableHeaderList: /*tableJson*/ ctx[0].headerList,
    				tableContentList: /*tableJson*/ ctx[0].tableContentList
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(table.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file$8, 47, 0, 1400);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			mount_component(table, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const userinput_changes = {};
    			if (dirty & /*searchterm*/ 2) userinput_changes.searchterm = /*searchterm*/ ctx[1];
    			if (dirty & /*selected*/ 4) userinput_changes.selected = /*selected*/ ctx[2];
    			userinput.$set(userinput_changes);

    			if (/*showResultLoader*/ ctx[3]) {
    				if (if_block) {
    					if (dirty & /*showResultLoader*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const table_changes = {};
    			if (dirty & /*tableJson*/ 1) table_changes.tableHeaderList = /*tableJson*/ ctx[0].headerList;
    			if (dirty & /*tableJson*/ 1) table_changes.tableContentList = /*tableJson*/ ctx[0].tableContentList;
    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(table);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dictionary", slots, []);

    	let tableJson = {
    		headerList: [],
    		tableContentList: [[], []]
    	};

    	let searchterm = "";
    	let selected;
    	let showResultLoader = false;
    	let placeholderSearchDisplayText = "Enter a dictionary search term";
    	let dropdownPlaceholderDisplayText = "Please Select a Dictionary Data Source";

    	let dropdownOptions = [
    		{
    			value: "oxford",
    			displayText: "Oxford Dictionary API"
    		},
    		{
    			value: "owlbot",
    			displayText: "Owl Bot API"
    		}
    	];

    	async function handleParentUpdate(updateParentEvent) {
    		console.log(updateParentEvent);
    		const detail = updateParentEvent.detail;
    		$$invalidate(1, searchterm = detail.searchQuery);
    		$$invalidate(2, selected = detail.selection);
    		$$invalidate(3, showResultLoader = true);

    		if (selected == "owlbot") {
    			$$invalidate(0, tableJson = await dictionarypipeline.owlbotAPIResponsePipeline(searchterm));
    		} else {
    			$$invalidate(0, tableJson = await dictionarypipeline.oxfordDictionaryResponsePipeline(searchterm));
    		}

    		$$invalidate(3, showResultLoader = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<Dictionary> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		UserInput,
    		dictionarypipeline,
    		Table,
    		Spinner,
    		tableJson,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("tableJson" in $$props) $$invalidate(0, tableJson = $$props.tableJson);
    		if ("searchterm" in $$props) $$invalidate(1, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(2, selected = $$props.selected);
    		if ("showResultLoader" in $$props) $$invalidate(3, showResultLoader = $$props.showResultLoader);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(4, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(5, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    		if ("dropdownOptions" in $$props) $$invalidate(6, dropdownOptions = $$props.dropdownOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tableJson,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	];
    }

    class Dictionary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dictionary",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    //"https://www.goodreads.com/search.xml?key=YOUR_KEY&q=Ender%27s+Game"

    /**
    * Changes XML to JSON
    * Modified version from here: http://davidwalsh.name/convert-xml-json
    * @param {string} xml XML DOM tree
    */
    function xmlToJson(xml) {
     // Create the return object
     var obj = {};

     if (xml.nodeType == 1) {
       // element
       // do attributes
       if (xml.attributes.length > 0) {
         obj["@attributes"] = {};
         for (var j = 0; j < xml.attributes.length; j++) {
           var attribute = xml.attributes.item(j);
           obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
         }
       }
     } else if (xml.nodeType == 3) {
       // text
       obj = xml.nodeValue;
     }

     // do children
     // If all text nodes inside, get concatenated text from them.
     var textNodes = [].slice.call(xml.childNodes).filter(function(node) {
       return node.nodeType === 3;
     });
     if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
       obj = [].slice.call(xml.childNodes).reduce(function(text, node) {
         return text + node.nodeValue;
       }, "");
     } else if (xml.hasChildNodes()) {
       for (var i = 0; i < xml.childNodes.length; i++) {
         var item = xml.childNodes.item(i);
         var nodeName = item.nodeName;
         if (typeof obj[nodeName] == "undefined") {
           obj[nodeName] = xmlToJson(item);
         } else {
           if (typeof obj[nodeName].push == "undefined") {
             var old = obj[nodeName];
             obj[nodeName] = [];
             obj[nodeName].push(old);
           }
           obj[nodeName].push(xmlToJson(item));
         }
       }
     }
     return obj;
    }

    /*
    Usage:
    1. If you have an XML file URL:
    const response = await fetch('file_url');
    const xmlString = await response.text();
    var XmlNode = new DOMParser().parseFromString(xmlString, 'text/xml');
    xmlToJson(XmlNode);
    2. If you have an XML as string:
    var XmlNode = new DOMParser().parseFromString(yourXmlString, 'text/xml');
    xmlToJson(XmlNode);
    3. If you have the XML as a DOM Node:
    xmlToJson(YourXmlNode);
    */

    var goodReadsAPIPipelineResponse = async function(searchTerm) {
      if(searchTerm == '') {
        searchTerm = 'potter';
      }
       let queryParamsJson = {"key":keys.GOODREADS_API_KEY,"q":searchTerm};
       let response = await request.getResponseFromURL(constants.GOODREADS_API_URI, queryParamsJson);
       let XmlNode = new DOMParser().parseFromString(response, 'text/xml');
       let responseJson = xmlToJson(XmlNode);
       let parsedResponseList = parser.getParsedGoodReadsAPIResponse(responseJson);
       return parsedResponseList;
     };

    var bookpipeline = {
       goodReadsAPIPipelineResponse: goodReadsAPIPipelineResponse
    };

    /* src/components/Card.svelte generated by Svelte v3.29.7 */

    const file$9 = "src/components/Card.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (37:0) {#each cardJsonList as cardJson}
    function create_each_block$3(ctx) {
    	let div7;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span0;
    	let t1_value = /*cardJson*/ ctx[1].title + "";
    	let t1;
    	let i0;
    	let t3;
    	let div6;
    	let span1;
    	let t4_value = /*cardJson*/ ctx[1].author + "";
    	let t4;
    	let i1;
    	let t6;
    	let div5;
    	let div2;
    	let t7;
    	let t8_value = /*cardJson*/ ctx[1].ratings_count + "";
    	let t8;
    	let t9;
    	let div3;
    	let t10;
    	let t11_value = /*cardJson*/ ctx[1].text_reviews_count + "";
    	let t11;
    	let t12;
    	let div4;
    	let t13;
    	let t14_value = /*cardJson*/ ctx[1].average_rating + "";
    	let t14;
    	let t15;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t1 = text(t1_value);
    			i0 = element("i");
    			i0.textContent = "more_vert";
    			t3 = space();
    			div6 = element("div");
    			span1 = element("span");
    			t4 = text(t4_value);
    			i1 = element("i");
    			i1.textContent = "close";
    			t6 = space();
    			div5 = element("div");
    			div2 = element("div");
    			t7 = text("# Ratings: ");
    			t8 = text(t8_value);
    			t9 = space();
    			div3 = element("div");
    			t10 = text("# Reviews: ");
    			t11 = text(t11_value);
    			t12 = space();
    			div4 = element("div");
    			t13 = text("Average Rating: ");
    			t14 = text(t14_value);
    			t15 = space();
    			attr_dev(img, "class", "activator svelte-17a7cuw");
    			if (img.src !== (img_src_value = /*cardJson*/ ctx[1].image_url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Image");
    			add_location(img, file$9, 39, 8, 1340);
    			attr_dev(div0, "class", "card-image waves-effect waves-block waves-light");
    			add_location(div0, file$9, 38, 6, 1270);
    			attr_dev(i0, "class", "material-icons right");
    			add_location(i0, file$9, 42, 83, 1531);
    			attr_dev(span0, "class", "card-title activator grey-text text-darken-4 svelte-17a7cuw");
    			add_location(span0, file$9, 42, 8, 1456);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$9, 41, 6, 1421);
    			attr_dev(i1, "class", "material-icons right");
    			add_location(i1, file$9, 45, 74, 1703);
    			attr_dev(span1, "class", "card-title grey-text text-darken-4 svelte-17a7cuw");
    			add_location(span1, file$9, 45, 8, 1637);
    			attr_dev(div2, "class", "chip");
    			set_style(div2, "margin-top", "50px");
    			add_location(div2, file$9, 47, 10, 1796);
    			attr_dev(div3, "class", "chip");
    			add_location(div3, file$9, 50, 10, 1914);
    			attr_dev(div4, "class", "chip");
    			add_location(div4, file$9, 53, 10, 2013);
    			attr_dev(div5, "class", "card-action");
    			add_location(div5, file$9, 46, 8, 1760);
    			attr_dev(div6, "class", "card-reveal");
    			add_location(div6, file$9, 44, 6, 1603);
    			attr_dev(div7, "class", "card svelte-17a7cuw");
    			add_location(div7, file$9, 37, 2, 1245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, img);
    			append_dev(div7, t0);
    			append_dev(div7, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t1);
    			append_dev(span0, i0);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, span1);
    			append_dev(span1, t4);
    			append_dev(span1, i1);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, t10);
    			append_dev(div3, t11);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, t13);
    			append_dev(div4, t14);
    			append_dev(div7, t15);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cardJsonList*/ 1 && img.src !== (img_src_value = /*cardJson*/ ctx[1].image_url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*cardJsonList*/ 1 && t1_value !== (t1_value = /*cardJson*/ ctx[1].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*cardJsonList*/ 1 && t4_value !== (t4_value = /*cardJson*/ ctx[1].author + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*cardJsonList*/ 1 && t8_value !== (t8_value = /*cardJson*/ ctx[1].ratings_count + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*cardJsonList*/ 1 && t11_value !== (t11_value = /*cardJson*/ ctx[1].text_reviews_count + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*cardJsonList*/ 1 && t14_value !== (t14_value = /*cardJson*/ ctx[1].average_rating + "")) set_data_dev(t14, t14_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(37:0) {#each cardJsonList as cardJson}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let each_1_anchor;
    	let each_value = /*cardJsonList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cardJsonList*/ 1) {
    				each_value = /*cardJsonList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function truncate(input) {
    	if (input.length > 5) {
    		return input.substring(0, 5) + "...";
    	}

    	return input;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);

    	let { cardJsonList = [
    		{
    			author: "George R.R. Martin",
    			image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
    			ratings_count: "2016836",
    			text_reviews_count: "54718",
    			title: "A Game of Thrones (A Song of Ice and Fire, #1)"
    		},
    		{
    			author: "George R.R. Martin",
    			image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
    			ratings_count: "2016836",
    			text_reviews_count: "54718",
    			title: "A Game of Thrones (A Song of Ice and Fire, #1)"
    		},
    		{
    			author: "George R.R. Martin",
    			image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
    			ratings_count: "2016836",
    			text_reviews_count: "54718",
    			title: "A Game of Thrones (A Song of Ice and Fire, #1)"
    		},
    		{
    			author: "George R.R. Martin",
    			image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
    			ratings_count: "2016836",
    			text_reviews_count: "54718",
    			title: "A Game of Thrones (A Song of Ice and Fire, #1)"
    		}
    	] } = $$props;

    	
    	const writable_props = ["cardJsonList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("cardJsonList" in $$props) $$invalidate(0, cardJsonList = $$props.cardJsonList);
    	};

    	$$self.$capture_state = () => ({ cardJsonList, truncate });

    	$$self.$inject_state = $$props => {
    		if ("cardJsonList" in $$props) $$invalidate(0, cardJsonList = $$props.cardJsonList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cardJsonList];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { cardJsonList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get cardJsonList() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardJsonList(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Books.svelte generated by Svelte v3.29.7 */

    const { console: console_1$5 } = globals;
    const file$a = "src/Books.svelte";

    // (41:0) {#if showResultLoader}
    function create_if_block$4(ctx) {
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(41:0) {#if showResultLoader}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let userinput;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let div;
    	let t3;
    	let card;
    	let current;

    	userinput = new UserInput({
    			props: {
    				searchterm: /*searchterm*/ ctx[0],
    				selected: /*selected*/ ctx[1],
    				dropdownOptions: /*dropdownOptions*/ ctx[6],
    				placeholderSearchDisplayText: /*placeholderSearchDisplayText*/ ctx[4],
    				dropdownPlaceholderDisplayText: /*dropdownPlaceholderDisplayText*/ ctx[5]
    			},
    			$$inline: true
    		});

    	userinput.$on("updateParent", /*handleParentUpdate*/ ctx[7]);
    	let if_block = /*showResultLoader*/ ctx[2] && create_if_block$4(ctx);

    	card = new Card({
    			props: {
    				cardJsonList: /*goodReadsResponseJsonList*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(card.$$.fragment);
    			add_location(br0, file$a, 37, 0, 1154);
    			add_location(br1, file$a, 38, 0, 1160);
    			attr_dev(div, "class", "container");
    			add_location(div, file$a, 39, 0, 1166);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t3);
    			mount_component(card, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const userinput_changes = {};
    			if (dirty & /*searchterm*/ 1) userinput_changes.searchterm = /*searchterm*/ ctx[0];
    			if (dirty & /*selected*/ 2) userinput_changes.selected = /*selected*/ ctx[1];
    			userinput.$set(userinput_changes);

    			if (/*showResultLoader*/ ctx[2]) {
    				if (if_block) {
    					if (dirty & /*showResultLoader*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t3);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const card_changes = {};
    			if (dirty & /*goodReadsResponseJsonList*/ 8) card_changes.cardJsonList = /*goodReadsResponseJsonList*/ ctx[3];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Books", slots, []);
    	let searchterm = "";
    	let selected;
    	let showResultLoader = false;
    	let placeholderSearchDisplayText = "Enter a book search term";
    	let dropdownPlaceholderDisplayText = "Please Select a Book Data Source";
    	let goodReadsResponseJsonList = [];

    	let dropdownOptions = [
    		{
    			value: "goodreads",
    			displayText: "GoodReads API"
    		}
    	];

    	async function handleParentUpdate(updateParentEvent) {
    		console.log(updateParentEvent);
    		const detail = updateParentEvent.detail;
    		$$invalidate(0, searchterm = detail.searchQuery);
    		$$invalidate(1, selected = detail.selection);
    		$$invalidate(2, showResultLoader = true);
    		$$invalidate(3, goodReadsResponseJsonList = await bookpipeline.goodReadsAPIPipelineResponse(searchterm));
    		$$invalidate(2, showResultLoader = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Books> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		UserInput,
    		bookpipeline,
    		Card,
    		Spinner,
    		searchterm,
    		selected,
    		showResultLoader,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		goodReadsResponseJsonList,
    		dropdownOptions,
    		handleParentUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("searchterm" in $$props) $$invalidate(0, searchterm = $$props.searchterm);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("showResultLoader" in $$props) $$invalidate(2, showResultLoader = $$props.showResultLoader);
    		if ("placeholderSearchDisplayText" in $$props) $$invalidate(4, placeholderSearchDisplayText = $$props.placeholderSearchDisplayText);
    		if ("dropdownPlaceholderDisplayText" in $$props) $$invalidate(5, dropdownPlaceholderDisplayText = $$props.dropdownPlaceholderDisplayText);
    		if ("goodReadsResponseJsonList" in $$props) $$invalidate(3, goodReadsResponseJsonList = $$props.goodReadsResponseJsonList);
    		if ("dropdownOptions" in $$props) $$invalidate(6, dropdownOptions = $$props.dropdownOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		searchterm,
    		selected,
    		showResultLoader,
    		goodReadsResponseJsonList,
    		placeholderSearchDisplayText,
    		dropdownPlaceholderDisplayText,
    		dropdownOptions,
    		handleParentUpdate
    	];
    }

    class Books extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Books",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    // Export the route definition object

    var routes = {
      // Exact path
      
        '/': Food,
        '/cartoon': Cartoon,
        '/food': Food,
        '/dictionary': Dictionary,
        '/books': Books
    };

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$b = "src/App.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let navbar;
    	let t;
    	let router;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    			attr_dev(main, "class", "svelte-f1s2ps");
    			add_location(main, file$b, 7, 0, 144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

// ============================================
// Módulo de Autenticação
// ============================================

const Auth = {

  // ---------- CADASTRO ----------
  async register({ email, password, nome, whatsapp, tipo, cidade, bairro, cep, service_types }) {
    try {

      // Verifica se o cliente Supabase foi carregado
      if (!window.supabaseClient) {
        throw new Error('Cliente Supabase não foi inicializado.');
      }

      // 1. Cria o usuário no Supabase Auth
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo,
            whatsapp
          }
        }
      });

      if (error) throw error;

      // Se a confirmação de e-mail estiver ativada,
      // o Supabase pode criar o usuário sem retornar uma sessão.
      if (!data.user) {
        throw new Error('Usuário não foi criado.');
      }

      const userId = data.user.id;

      // 2. Atualiza o perfil criado pelo trigger
      const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .update({
          whatsapp: whatsapp || null,
          cidade: cidade || null,
          bairro: bairro || null,
          cep: cep || null
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Se for prestador, vincula os tipos de serviço
      if (tipo === 'prestador' && service_types?.length) {

        const vinculos = service_types.map(stId => ({
          provider_id: userId,
          service_type_id: parseInt(stId, 10)
        }));

        const { error: vincError } = await window.supabaseClient
          .from('provider_service_types')
          .insert(vinculos);

        if (vincError) throw vincError;
      }

      return {
        success: true,
        user: data.user
      };

    } catch (error) {
      console.error('Erro no cadastro:', error);

      return {
        success: false,
        error: error.message
      };
    }
  },


  // ---------- LOGIN ----------
  async login(email, password) {
    try {

      if (!window.supabaseClient) {
        throw new Error('Cliente Supabase não foi inicializado.');
      }

      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      // Busca o tipo do usuário
      const { data: profile, error: profileError } =
        await window.supabaseClient
          .from('profiles')
          .select('tipo, nome')
          .eq('id', data.user.id)
          .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      }

      // Redireciona baseado no tipo
      if (profile?.tipo === 'cliente') {
        window.location.href = 'cliente/dashboard-cliente.html';
      } else {
        window.location.href = 'prestador/dashboard.html';
      }

      return {
        success: true,
        user: data.user,
        profile
      };

    } catch (error) {

      console.error('Erro no login:', error);

      let mensagem = 'Erro ao fazer login';

      if (error.message?.includes('Invalid login credentials')) {
        mensagem = 'E-mail ou senha incorretos';
      }

      return {
        success: false,
        error: mensagem
      };
    }
  },


  // ---------- LOGOUT ----------
  async logout() {

    try {
      await window.supabaseClient.auth.signOut();
    } finally {
      window.location.href = 'index.html';
    }
  },


  // ---------- VERIFICAR SESSÃO ----------
  async getCurrentUser() {

    const {
      data: { user }
    } = await window.supabaseClient.auth.getUser();

    return user;
  },


  // ---------- BUSCAR ENDEREÇO POR CEP ----------
  async buscarEnderecoPorCep(cep) {

    try {

      // Remove caracteres não numéricos
      const cepLimpo = cep.replace(/\D/g, '');

      // Verifica se o CEP tem 8 dígitos
      if (cepLimpo.length !== 8) {
        return {
          success: false,
          error: 'CEP inválido. Digite 8 números.'
        };
      }

      // Faz a requisição para a API ViaCEP
      const response =
        await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      // Verifica se o CEP foi encontrado
      if (data.erro) {
        return {
          success: false,
          error: 'CEP não encontrado'
        };
      }

      // Retorna os dados do endereço
      return {
        success: true,
        data: {
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
          complemento: data.complemento
        }
      };

    } catch (error) {

      console.error('Erro ao buscar CEP:', error);

      return {
        success: false,
        error: 'Erro ao buscar o CEP. Tente novamente.'
      };
    }
  },


  // ---------- ATUALIZAR PERFIL COM CEP ----------
  async atualizarPerfilComCep(userId, dadosAtualizados) {

    try {

      const { error } = await window.supabaseClient
        .from('profiles')
        .update({
          cep: dadosAtualizados.cep || null,
          cidade: dadosAtualizados.cidade || null,
          bairro: dadosAtualizados.bairro || null,
          logradouro: dadosAtualizados.logradouro || null,
          uf: dadosAtualizados.uf || null,
          complemento: dadosAtualizados.complemento || null
        })
        .eq('id', userId);

      if (error) throw error;

      return {
        success: true
      };

    } catch (error) {

      console.error('Erro ao atualizar perfil:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Disponibiliza o módulo globalmente
window.Auth = Auth;